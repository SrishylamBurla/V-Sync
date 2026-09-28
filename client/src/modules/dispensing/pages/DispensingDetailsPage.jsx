import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Glasses,
  Loader2,
  Phone,
  Printer,
  Receipt,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  DocumentShell,
  Field,
  InfoGrid,
  Section,
} from "../../../components/common/DocumentUI";

import { getDispensing, updateDispensing } from "../dispensing.api";
import { addPayment, createInvoice } from "../../billing/billing.api";

/* =========================================================
   STATUS WORKFLOW
========================================================= */

const nextStatus = {
  draft: "ordered",
  ordered: "not_ready",
  not_ready: "ready",
  ready: "notified",
  notified: "collected",
};

/* =========================================================
   HELPERS
========================================================= */

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeItemType = (value) => {
  const type = String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (type.includes("contact") || type.includes("lens")) {
    return "contact_lens";
  }

  return "spectacle";
};

/* =========================================================
   PAGE
========================================================= */

export default function DispensingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     BILLING STATE
  ======================================================= */

  const [billOpen, setBillOpen] = useState(false);
  const [billMode, setBillMode] = useState("pay_later");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [creatingBill, setCreatingBill] = useState(false);
  const [billSuccess, setBillSuccess] = useState("");

  /* =======================================================
     ID VALIDATION

     Prevents requests such as:
     /dispensing/:id
     /dispensing/queue/:id
  ======================================================= */

  const isValidId =
    Boolean(id) &&
    id !== ":id" &&
    /^[a-fA-F0-9]{24}$/.test(id);

  /* =======================================================
     LOAD DISPENSING JOB
  ======================================================= */

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!isValidId) {
      setRecord(null);

      setError(
        "Invalid dispensing job ID. Please open the job from the dispensing register.",
      );

      setLoading(false);
      return;
    }

    try {
      const response = await getDispensing(id);

      setRecord(response?.data || null);
    } catch (err) {
      setRecord(null);

      setError(
        err?.response?.data?.message ||
          "Unable to load dispensing job",
      );
    } finally {
      setLoading(false);
    }
  }, [id, isValidId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* =======================================================
     ITEM TYPE
  ======================================================= */

  const itemType = normalizeItemType(record?.itemType);

  const isSpectacle = itemType === "spectacle";
  const isContactLens = itemType === "contact_lens";

  /* =======================================================
     TOTAL
  ======================================================= */

  const total = useMemo(() => {
    if (!record) return 0;

    /* CONTACT LENS */

    if (isContactLens) {
      const calculated =
        Number(record.quantity || 1) *
          Number(record.unitPrice || 0) -
        Number(record.discount || 0);

      return Math.max(
        0,
        Number(record.total || 0) || calculated,
      );
    }

    /* SPECTACLE */

    const frame = Number(record.frame?.price || 0);

    const lens = Number(record.lens?.price || 0);

    const extras = (record.extras || []).reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    return Math.max(
      0,
      frame +
        lens +
        extras -
        Number(record.discount || 0),
    );
  }, [record, isContactLens]);

  /* =======================================================
     ADVANCE STATUS

     draft       -> ordered
     ordered     -> not_ready
     not_ready   -> ready
     ready       -> notified
     notified    -> collected
  ======================================================= */

  const advanceStatus = async () => {
    const target = nextStatus[record?.status];

    if (!record || !target || !isValidId) {
      return;
    }

    setSavingStatus(true);
    setError("");

    try {
      const response = await updateDispensing(id, target);

      setRecord(response?.data || record);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update dispensing status",
      );
    } finally {
      setSavingStatus(false);
    }
  };

  /* =======================================================
     CREATE BILL
  ======================================================= */

  const createBill = async (event) => {
    event.preventDefault();

    if (!record?.patientId?._id) {
      setError(
        "Patient information is missing from this dispensing record.",
      );

      return;
    }

    const amount =
      billMode === "pay_full"
        ? total
        : Number(paymentAmount || 0);

    if (
      billMode === "partial" &&
      (amount <= 0 || amount >= total)
    ) {
      setError(
        "Partial payment must be greater than zero and less than the bill total.",
      );

      return;
    }

    setCreatingBill(true);
    setError("");

    try {
      let items = [];

      /* ===================================================
         SPECTACLE BILL
      =================================================== */

      if (isSpectacle) {
        items = [
          ...(record.frame?.price
            ? [
                {
                  description: `Frame ${
                    record.frame.code ||
                    record.frame.description ||
                    ""
                  }`.trim(),

                  category: "spectacle",

                  quantity: 1,

                  unitPrice: Number(
                    record.frame.price || 0,
                  ),

                  discount: Number(
                    record.frame.discount || 0,
                  ),

                  referenceId: record._id,
                },
              ]
            : []),

          ...(record.lens?.price
            ? [
                {
                  description: `Lens ${
                    record.lens.code ||
                    record.lens.description ||
                    ""
                  }`.trim(),

                  category: "spectacle",

                  quantity: 1,

                  unitPrice: Number(
                    record.lens.price || 0,
                  ),

                  discount: 0,

                  referenceId: record._id,
                },
              ]
            : []),

          ...(record.extras || [])
            .filter(
              (item) =>
                Number(item.price || 0) > 0,
            )
            .map((item) => ({
              description:
                item.name ||
                item.description ||
                "Optical extra",

              category: "sundry",

              quantity: 1,

              unitPrice: Number(
                item.price || 0,
              ),

              discount: 0,

              referenceId: record._id,
            })),
        ];
      }

      /* ===================================================
         CONTACT LENS BILL
      =================================================== */

      else {
        items = [
          {
            description: `${record.brand || record.lensType || "Contact lens"} ${
              record.model || ""
            }`.trim(),

            category: "contact_lens",

            quantity: Number(
              record.quantity || 1,
            ),

            unitPrice: Number(
              record.unitPrice || 0,
            ),

            discount: Number(
              record.discount || 0,
            ),

            referenceId: record._id,
          },
        ];
      }

      /* ===================================================
         CREATE INVOICE
      =================================================== */

      const response = await createInvoice({
        patientId: record.patientId._id,

        dueDate:
          billMode === "pay_later"
            ? undefined
            : new Date().toISOString(),

        items,

        discount: isSpectacle
          ? Number(record.discount || 0)
          : 0,

        tax: 0,

        notes: `Created from ${record.itemType} dispensing ${record.recordNumber}`,
      });

      const invoice = response?.data;

      if (!invoice?._id) {
        throw new Error(
          "Invoice was created without an invoice ID.",
        );
      }

      /* ===================================================
         PAYMENT
      =================================================== */

      if (amount > 0) {
        await addPayment(invoice._id, {
          amount,

          method: paymentMethod,

          reference: paymentReference,

          notes:
            billMode === "pay_full"
              ? "Paid at dispensing"
              : "Partial payment at dispensing",
        });
      }

      setBillSuccess(invoice.invoiceNumber);

      setBillOpen(false);

      setTimeout(() => {
        navigate(`/billing/${invoice._id}`);
      }, 700);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create bill",
      );
    } finally {
      setCreatingBill(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        <Loader2
          size={18}
          className="mr-2 animate-spin"
        />
        Loading dispensing record...
      </div>
    );
  }

  /* =======================================================
     ERROR / NO RECORD
  ======================================================= */

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Dispensing record not found"}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const patient = record.patientId;

  const workflow = [
    {
      label: "Ordered",
      value: record.orderDate || record.jobDate,
    },
    {
      label: "Ready",
      value: record.jobReadyAt,
    },
    {
      label: "Last notified",
      value: record.lastNotifiedAt,
    },
    {
      label: "Collected",
      value: record.collectedAt,
    },
    {
      label: "Notifications",
      value: record.notificationCount ?? 0,
    },
  ];

  const currentNextStatus =
    nextStatus[record.status];

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <DocumentShell
        eyebrow={`Operations · ${
          isSpectacle
            ? "Spectacle Dispensing"
            : "Contact Lens Dispensing"
        }`}
        title={record.recordNumber}
        subtitle={`${
          isSpectacle
            ? "Spectacle Job"
            : "Contact Lens Job"
        } · ${patientName(patient)}`}
        code="DISPENSING"
        status={label(record.status)}
        actions={
          <>
            {/* BACK */}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {/* CREATE BILL */}

            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white"
            >
              <Receipt size={14} />
              Create Bill
            </button>

            {/* STATUS */}

            {currentNextStatus && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() =>
                  void advanceStatus()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingStatus ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={14} />
                )}

                {savingStatus
                  ? "Updating..."
                  : `Move to ${label(
                      currentNextStatus,
                    )}`}
              </button>
            )}

            {/* PRINT */}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
            >
              <Printer size={14} />
              Print
            </button>
          </>
        }
      >
        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            BILL SUCCESS
        ================================================== */}

        {billSuccess && (
          <div className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
            Bill {billSuccess} created successfully.
            Opening invoice...
          </div>
        )}

        {/* =================================================
            01 PATIENT
        ================================================== */}

        <Section number="01" title="Patient">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <InfoGrid
              items={[
                {
                  label: "Patient",
                  value: patientName(patient),
                },

                {
                  label: "Patient number",
                  value:
                    patient?.patientNumber,
                },

                {
                  label: "Date of birth",
                  value: formatDate(
                    patient?.dateOfBirth ||
                      patient?.dob,
                  ),
                },

                {
                  label: "Phone",
                  value:
                    patient?.phone ||
                    patient?.mobile ||
                    "—",
                },
              ]}
            />

            <div className="flex flex-wrap items-start gap-2">
              <button
                type="button"
                onClick={() =>
                  patient?._id &&
                  navigate(
                    `/patients/${patient._id}`,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white"
              >
                <UserRound size={14} />
                Patient workspace
              </button>

              {(patient?.phone ||
                patient?.mobile) && (
                <a
                  href={`tel:${
                    patient.phone ||
                    patient.mobile
                  }`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* =================================================
            02 JOB INFORMATION
        ================================================== */}

        <Section
          number="02"
          title={
            isSpectacle
              ? "Spectacle Job"
              : "Contact Lens Job"
          }
        >
          <InfoGrid
            items={[
              {
                label: "Job type",
                value: isSpectacle
                  ? "Spectacle"
                  : "Contact Lens",
              },

              {
                label: "Job / order number",
                value: record.recordNumber,
              },

              {
                label: "Order date",
                value: formatDate(
                  record.orderDate ||
                    record.jobDate,
                ),
              },

              {
                label: "Due date",
                value: formatDate(
                  record.dueDate,
                ),
              },

              {
                label: "Status",
                value: label(record.status),
              },
            ]}
          />
        </Section>

        {/* =================================================
            03 SPECTACLE
        ================================================== */}

        {isSpectacle && (
          <>
            <Section
              number="03"
              title="Spectacle dispensing"
              description="Frame, lens and prescription information for this spectacle job."
            >
              <div className="grid gap-5 xl:grid-cols-2">
                <DetailCard
                  title="Frame"
                  icon={Glasses}
                  items={[
                    {
                      label: "Code",
                      value:
                        record.frame?.code,
                    },

                    {
                      label: "Description",
                      value:
                        record.frame
                          ?.description,
                    },

                    {
                      label: "Size",
                      value:
                        record.frame?.size,
                    },

                    {
                      label: "Type",
                      value:
                        record.frame?.type,
                    },

                    {
                      label: "Fitting",
                      value:
                        record.frame?.fitting,
                    },

                    {
                      label: "Price",
                      value: money(
                        record.frame?.price,
                      ),
                    },
                  ]}
                />

                <DetailCard
                  title="Lens"
                  icon={Glasses}
                  items={[
                    {
                      label: "Code",
                      value:
                        record.lens?.code,
                    },

                    {
                      label: "Description",
                      value:
                        record.lens
                          ?.description,
                    },

                    {
                      label: "Supplier",
                      value:
                        record.lens?.supplier,
                    },

                    {
                      label: "Price",
                      value: money(
                        record.lens?.price,
                      ),
                    },
                  ]}
                />
              </div>

              {record.extras?.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Spectacle extras
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {record.extras.map(
                      (item, index) => (
                        <div
                          key={
                            item._id || index
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="text-xs font-bold text-slate-800">
                            {item.name ||
                              item.description ||
                              "Extra"}
                          </div>

                          <div className="mt-1 text-xs font-semibold text-slate-600">
                            {money(item.price)}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </Section>

            <Section
              number="04"
              title="Spectacle prescription"
            >
              <RxTable
                rx={record.rx}
                pd={record.pd}
              />
            </Section>
          </>
        )}

        {/* =================================================
            03 CONTACT LENS
        ================================================== */}

        {isContactLens && (
          <>
            <Section
              number="03"
              title="Contact lens dispensing"
              description="Commercial contact-lens job information. Clinical fitting and consultation remain in the patient's clinical consultation."
            >
              <InfoGrid
                items={[
                  {
                    label: "Lens type",
                    value:
                      record.lensType,
                  },

                  {
                    label: "Brand",
                    value: record.brand,
                  },

                  {
                    label: "Model",
                    value: record.model,
                  },

                  {
                    label: "Supplier",
                    value:
                      record.supplier,
                  },

                  {
                    label: "Replacement",
                    value:
                      record.replacement,
                  },

                  {
                    label: "Quantity",
                    value:
                      record.quantity,
                  },

                  {
                    label: "Unit price",
                    value: money(
                      record.unitPrice,
                    ),
                  },

                  {
                    label: "Discount",
                    value: money(
                      record.discount,
                    ),
                  },
                ]}
              />
            </Section>

            <Section
              number="04"
              title="Contact lens parameters"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard
                  title="Right eye · OD"
                  items={[
                    {
                      label: "Power",
                      value:
                        record.right?.power,
                    },

                    {
                      label: "Sphere",
                      value:
                        record.right?.sphere,
                    },

                    {
                      label: "Cylinder",
                      value:
                        record.right?.cylinder,
                    },

                    {
                      label: "Axis",
                      value:
                        record.right?.axis,
                    },

                    {
                      label: "Base curve",
                      value:
                        record.right?.bc,
                    },

                    {
                      label: "Diameter",
                      value:
                        record.right?.dia,
                    },
                  ]}
                />

                <DetailCard
                  title="Left eye · OS"
                  items={[
                    {
                      label: "Power",
                      value:
                        record.left?.power,
                    },

                    {
                      label: "Sphere",
                      value:
                        record.left?.sphere,
                    },

                    {
                      label: "Cylinder",
                      value:
                        record.left?.cylinder,
                    },

                    {
                      label: "Axis",
                      value:
                        record.left?.axis,
                    },

                    {
                      label: "Base curve",
                      value:
                        record.left?.bc,
                    },

                    {
                      label: "Diameter",
                      value:
                        record.left?.dia,
                    },
                  ]}
                />
              </div>
            </Section>
          </>
        )}

        {/* =================================================
            05 BILLING
        ================================================== */}

        <Section
          number="05"
          title={
            isSpectacle
              ? "Spectacle billing summary"
              : "Contact lens billing summary"
          }
        >
          <div className="ml-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {isSpectacle ? (
              <div className="space-y-2 text-sm">
                <BillRow
                  label="Frame"
                  value={money(
                    record.frame?.price,
                  )}
                />

                <BillRow
                  label="Lens"
                  value={money(
                    record.lens?.price,
                  )}
                />

                <BillRow
                  label="Extras"
                  value={money(
                    (record.extras || []).reduce(
                      (sum, item) =>
                        sum +
                        Number(
                          item.price || 0,
                        ),
                      0,
                    ),
                  )}
                />

                <BillRow
                  label="Discount"
                  value={money(
                    record.discount,
                  )}
                />

                <div className="flex justify-between border-t border-slate-300 pt-3 text-lg">
                  <b>Total</b>
                  <b>{money(total)}</b>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <BillRow
                  label="Unit price"
                  value={money(
                    record.unitPrice,
                  )}
                />

                <BillRow
                  label="Quantity"
                  value={
                    record.quantity || 1
                  }
                />

                <BillRow
                  label="Discount"
                  value={money(
                    record.discount,
                  )}
                />

                <div className="flex justify-between border-t border-slate-300 pt-3 text-lg">
                  <b>Total</b>
                  <b>{money(total)}</b>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* =================================================
            06 WORKFLOW
        ================================================== */}

        <Section
          number="06"
          title={
            isSpectacle
              ? "Spectacle workflow"
              : "Contact lens workflow"
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </div>

                <div className="mt-2 text-xs font-bold text-slate-700">
                  {typeof item.value ===
                  "number"
                    ? item.value
                    : item.value
                      ? formatDate(
                          item.value,
                        )
                      : "Pending"}
                </div>
              </div>
            ))}
          </div>

          {/* CURRENT STATUS CONTROL */}

          {currentNextStatus && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current status
                </div>

                <div className="mt-1 text-sm font-bold text-slate-900">
                  {label(record.status)}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Next stage:{" "}
                  <span className="font-semibold text-slate-700">
                    {label(
                      currentNextStatus,
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={savingStatus}
                onClick={() =>
                  void advanceStatus()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {savingStatus ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={14} />
                )}

                {savingStatus
                  ? "Updating..."
                  : `Move to ${label(
                      currentNextStatus,
                    )}`}
              </button>
            </div>
          )}
        </Section>

        {/* =================================================
            07 NOTES
        ================================================== */}

        <Section number="07" title="Notes">
          <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            {record.notes ||
              "No dispensing notes recorded."}
          </p>
        </Section>
      </DocumentShell>

      {/* ===================================================
          BILL MODAL
      =================================================== */}

      {billOpen && (
        <BillModal
          total={total}
          mode={billMode}
          setMode={setBillMode}
          paymentAmount={paymentAmount}
          setPaymentAmount={
            setPaymentAmount
          }
          paymentMethod={paymentMethod}
          setPaymentMethod={
            setPaymentMethod
          }
          reference={paymentReference}
          setReference={
            setPaymentReference
          }
          onClose={() =>
            setBillOpen(false)
          }
          onSubmit={createBill}
          saving={creatingBill}
        />
      )}
    </>
  );
}

/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
  title,
  icon: Icon,
  items,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600">
          {Icon ? (
            <Icon size={15} />
          ) : (
            <FileText size={15} />
          )}
        </div>

        <div className="text-xs font-bold text-slate-900">
          {title}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {item.label}
            </div>

            <div className="mt-1 text-xs font-semibold text-slate-700">
              {item.value || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   BILL ROW
========================================================= */

function BillRow({ label: title, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">
        {title}
      </span>

      <b className="text-slate-800">
        {value}
      </b>
    </div>
  );
}

/* =========================================================
   PRESCRIPTION TABLE
========================================================= */

function RxTable({ rx, pd }) {
  const rows = [
    "sphere",
    "cylinder",
    "axis",
    "add",
    "prism",
    "base",
    "va",
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[650px] text-xs">
        <thead>
          <tr className="bg-slate-50 text-left text-[9px] uppercase tracking-wider text-slate-400">
            <th className="p-3">
              Field
            </th>

            <th className="p-3">
              OD
            </th>

            <th className="p-3">
              OS
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((field) => (
            <tr
              key={field}
              className="border-t border-slate-100"
            >
              <td className="p-3 font-semibold text-slate-500">
                {label(field)}
              </td>

              <td className="p-3">
                {rx?.right?.[field] ||
                  "—"}
              </td>

              <td className="p-3">
                {rx?.left?.[field] ||
                  "—"}
              </td>
            </tr>
          ))}

          <tr className="border-t border-slate-100">
            <td className="p-3 font-semibold text-slate-500">
              PD
            </td>

            <td className="p-3">
              {pd?.right || "—"}
            </td>

            <td className="p-3">
              {pd?.left || "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   BILL MODAL
========================================================= */

function BillModal({
  total,
  mode,
  setMode,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  reference,
  setReference,
  onClose,
  onSubmit,
  saving,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
              Billing
            </div>

            <h2 className="mt-1 text-base font-bold text-slate-900">
              Create bill from dispensing
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="space-y-5 p-5"
        >
          {/* TOTAL */}

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Bill total
            </div>

            <div className="mt-1 text-2xl font-bold text-slate-950">
              {money(total)}
            </div>
          </div>

          {/* PAYMENT MODE */}

          <div className="grid gap-2 md:grid-cols-3">
            {[
              ["pay_full", "Pay in full"],
              [
                "partial",
                "Partial payment",
              ],
              [
                "pay_later",
                "Pay later",
              ],
            ].map(
              ([value, labelText]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);

                    if (
                      value ===
                      "pay_full"
                    ) {
                      setPaymentAmount(
                        String(total),
                      );
                    }

                    if (
                      value ===
                      "pay_later"
                    ) {
                      setPaymentAmount(
                        "",
                      );
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    mode === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold">
                    {labelText}
                  </div>

                  <div className="mt-1 text-[9px] text-slate-400">
                    {value ===
                    "pay_full"
                      ? "Invoice is paid immediately"
                      : value ===
                          "partial"
                        ? "Take a deposit now"
                        : "Keep the full amount outstanding"}
                  </div>
                </button>
              ),
            )}
          </div>

          {/* PAYMENT DETAILS */}

          {mode !== "pay_later" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Amount"
                type="number"
                value={
                  mode === "pay_full"
                    ? total
                    : paymentAmount
                }
                onChange={
                  setPaymentAmount
                }
              />

              <Field
                label="Method"
                value={
                  paymentMethod
                }
                onChange={
                  setPaymentMethod
                }
                options={[
                  "cash",
                  "card",
                  "upi",
                  "bank_transfer",
                  "insurance",
                  "other",
                ]}
              />

              <Field
                label="Reference"
                value={
                  reference
                }
                onChange={
                  setReference
                }
              />
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Creating..."
                : "Create bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}