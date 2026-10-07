import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit3,
  Printer,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import {
  addPayment,
  addRefund,
  getInvoice,
  updateInvoice,
} from "../billing.api";
import {
  DocumentShell,
  Field,
  InfoGrid,
  Section,
} from "../../../components/common/DocumentUI";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const name = (person) =>
  [person?.firstName, person?.middleName, person?.lastName]
    .filter(Boolean)
    .join(" ") || "—";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const emptyItem = () => ({
  description: "",
  category: "other",
  quantity: 1,
  unitPrice: "",
  discount: 0,
});

const toEditForm = (invoice) => ({
  invoiceDate: toDateInput(invoice?.invoiceDate),
  dueDate: toDateInput(invoice?.dueDate),
  discount: invoice?.discount ?? 0,
  tax: invoice?.tax ?? 0,
  notes: invoice?.notes || "",
  items: (invoice?.items || []).map((item) => ({
    _id: item._id,
    description: item.description || "",
    category: item.category || "other",
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    discount: item.discount ?? 0,
  })),
});

const finalizedStatuses = new Set(["paid", "void", "refunded"]);

export default function InvoiceDetailsPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [pay, setPay] = useState({
    amount: "",
    method: "cash",
    reference: "",
    notes: "",
  });
  const [refund, setRefund] = useState({
    amount: "",
    method: "cash",
    reason: "",
  });

  const load = useCallback(async () => {
    if (!id) {
      setError("Invoice ID is missing.");
      return;
    }

    try {
      setError("");
      const response = await getInvoice(id);
      setData(response?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load invoice",
      );
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const invoice = data?.invoice;
  const patient = invoice?.patientId;
  const isFinalized = finalizedStatuses.has(invoice?.status);

  const editTotal = useMemo(() => {
    if (!editForm) return Number(invoice?.total || 0);

    const subtotal = editForm.items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) * Number(item.unitPrice || 0) -
        Number(item.discount || 0),
      0,
    );

    return Math.max(
      0,
      subtotal -
        Number(editForm.discount || 0) +
        Number(editForm.tax || 0),
    );
  }, [editForm, invoice?.total]);

  const startEditing = () => {
    if (!invoice) return;
    setError("");
    setEditForm(toEditForm(invoice));
    setEditing(true);
  };

  const cancelEditing = () => {
    if (invoice) setEditForm(toEditForm(invoice));
    setEditing(false);
    setError("");
  };

  const updateItem = (index, key, value) => {
    setEditForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: value }
          : item,
      ),
    }));
  };

  const addItem = () => {
    setEditForm((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setEditForm((current) => ({
      ...current,
      items: current.items.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!invoice?._id || !editForm) return;

    const items = editForm.items
      .filter((item) => item.description.trim())
      .map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        description: item.description.trim(),
        category: item.category || "other",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        discount: Number(item.discount || 0),
      }));

    if (!items.length) {
      setError("Add at least one billable item.");
      return;
    }

    if (items.some((item) => item.quantity <= 0)) {
      setError("Each item quantity must be greater than zero.");
      return;
    }

    if (items.some((item) => item.unitPrice < 0 || item.discount < 0)) {
      setError("Price and discount values cannot be negative.");
      return;
    }

    if (Number(editForm.discount || 0) < 0 || Number(editForm.tax || 0) < 0) {
      setError("Invoice discount and tax cannot be negative.");
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      const payload = {
        invoiceDate: editForm.invoiceDate || undefined,
        dueDate: editForm.dueDate || undefined,
        discount: Number(editForm.discount || 0),
        tax: Number(editForm.tax || 0),
        notes: editForm.notes,
      };

      if (!isFinalized) {
        payload.items = items;
      }

      await updateInvoice(invoice._id, payload);

      // Reload the persisted invoice so Updated by / Updated at
      // always come from the database, including after discount changes.
      await load();

      setEditing(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update invoice",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const payment = async (event) => {
    event.preventDefault();

    try {
      setError("");
      await addPayment(id, {
        ...pay,
        amount: Number(pay.amount),
      });
      setPay({
        amount: "",
        method: "cash",
        reference: "",
        notes: "",
      });
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to record payment",
      );
    }
  };

  const doRefund = async (event) => {
    event.preventDefault();

    try {
      setError("");
      await addRefund(id, {
        ...refund,
        amount: Number(refund.amount),
      });
      setRefund({
        amount: "",
        method: "cash",
        reason: "",
      });
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to record refund",
      );
    }
  };

  if (!data || !invoice) {
    return (
      <div className="py-10 text-sm text-slate-500">
        {error || "Loading invoice..."}
      </div>
    );
  }

  return (
    <DocumentShell
      eyebrow="Finance"
      title="Invoice Record"
      subtitle="Complete invoice, payment, refund and audit document."
      code={invoice.invoiceNumber}
      status={invoice.status}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Edit3 size={14} />
              Edit invoice
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={14} />
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section number="01" title="Patient & invoice">
        {!editing ? (
          <InfoGrid
            items={[
              { label: "Patient", value: name(patient) },
              {
                label: "Patient No.",
                value: patient?.patientNumber,
              },
              { label: "Phone", value: patient?.phone },
              {
                label: "Invoice date",
                value: formatDate(invoice.invoiceDate),
              },
              {
                label: "Due date",
                value: formatDate(invoice.dueDate),
              },
              {
                label: "Created by",
                value: name(invoice.createdBy),
              },
              {
                label: "Updated by",
                value: invoice.updatedBy
                  ? name(invoice.updatedBy)
                  : "Not updated yet",
              },
              {
                label: "Created at",
                value: formatDateTime(invoice.createdAt),
              },
              {
                label: "Updated at",
                value: formatDateTime(invoice.updatedAt),
              },
            ]}
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Invoice date"
                type="date"
                value={editForm?.invoiceDate || ""}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    invoiceDate: value,
                  }))
                }
              />
              <Field
                label="Due date"
                type="date"
                value={editForm?.dueDate || ""}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    dueDate: value,
                  }))
                }
              />
              <Field
                label="Invoice discount"
                type="number"
                value={editForm?.discount ?? 0}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    discount: value,
                  }))
                }
              />
              <Field
                label="Tax"
                type="number"
                value={editForm?.tax ?? 0}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    tax: value,
                  }))
                }
              />
            </div>

            <InfoGrid
              items={[
                { label: "Patient", value: name(patient) },
                {
                  label: "Patient No.",
                  value: patient?.patientNumber,
                },
                {
                  label: "Created by",
                  value: name(invoice.createdBy),
                },
                {
                  label: "Updated by",
                  value: invoice.updatedBy
                    ? name(invoice.updatedBy)
                    : "Not updated yet",
                },
              ]}
            />
          </div>
        )}
      </Section>

      <Section number="02" title="Invoice items">
        {editing ? (
          <div className="space-y-3">
            {isFinalized && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                This invoice is finalized. Line items cannot be changed, but invoice date, due date, discount, tax and notes can still be updated.
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2 text-right">Line total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(editForm?.items || []).map((item, index) => (
                    <tr
                      key={item._id || `new-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          value={item.description}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          disabled={isFinalized}
                          value={item.category}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "category",
                              event.target.value,
                            )
                          }
                          className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                        >
                          <option value="consultation">Consultation</option>
                          <option value="spectacle">Spectacle</option>
                          <option value="contact_lens">Contact lens</option>
                          <option value="sundry">Sundry</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          min="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantity",
                              event.target.value,
                            )
                          }
                          className="h-9 w-20 rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "unitPrice",
                              event.target.value,
                            )
                          }
                          className="h-9 w-24 rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "discount",
                              event.target.value,
                            )
                          }
                          className="h-9 w-24 rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                        />
                      </td>
                      <td className="p-2 text-right text-xs font-bold">
                        {money(
                          Number(item.quantity || 0) *
                            Number(item.unitPrice || 0) -
                            Number(item.discount || 0),
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          disabled={
                            isFinalized ||
                            (editForm?.items || []).length === 1
                          }
                          onClick={() => removeItem(index)}
                          className="text-[10px] font-semibold text-red-500 disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isFinalized && (
              <button
                type="button"
                onClick={addItem}
                className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                + Add line
              </button>
            )}

            <div className="ml-auto max-w-sm rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Preview total</span>
                <span>{money(editTotal)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-left">Category</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2 text-right">Unit</th>
                  <th className="py-2 text-right">Discount</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100"
                  >
                    <td className="py-3">
                      {item.description}
                    </td>
                    <td className="py-3 capitalize">
                      {String(item.category || "other").replace(
                        "_",
                        " ",
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right">
                      {money(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right">
                      {money(item.discount)}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {money(
                        Number(item.quantity) *
                          Number(item.unitPrice) -
                          Number(item.discount),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section number="03" title="Financial summary">
        <div className="ml-auto max-w-sm space-y-2 rounded-xl bg-slate-50 p-5 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <b>{money(invoice.subtotal)}</b>
          </div>
          <div className="flex justify-between">
            <span>Invoice discount</span>
            <b>{money(invoice.discount)}</b>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <b>{money(invoice.tax)}</b>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
            <b>Total</b>
            <b>{money(invoice.total)}</b>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <b className="text-emerald-700">
              {money(invoice.paidAmount)}
            </b>
          </div>
          <div className="flex justify-between">
            <span>Outstanding</span>
            <b className="text-amber-700">
              {money(invoice.balance)}
            </b>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
            <div className="flex justify-between gap-4">
              <span>Last updated by</span>
              <b className="text-right text-slate-700">
                {invoice.updatedBy ? name(invoice.updatedBy) : "Not updated yet"}
              </b>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span>Last updated at</span>
              <b className="text-right text-slate-700">
                {formatDateTime(invoice.updatedAt)}
              </b>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span>Discount updated by</span>
              <b className="text-right text-slate-700">
                {invoice.discountUpdatedBy
                  ? name(invoice.discountUpdatedBy)
                  : "Not changed yet"}
              </b>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span>Discount updated at</span>
              <b className="text-right text-slate-700">
                {formatDateTime(invoice.discountUpdatedAt)}
              </b>
            </div>
          </div>
        </div>
      </Section>

      <Section
        number="04"
        title="Record payment"
        description="Payments are separate immutable receipt records."
      >
        <form
          onSubmit={payment}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <Field
            label="Amount"
            type="number"
            value={pay.amount}
            onChange={(value) =>
              setPay({ ...pay, amount: value })
            }
          />
          <Field
            label="Method"
            value={pay.method}
            onChange={(value) =>
              setPay({ ...pay, method: value })
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
            value={pay.reference}
            onChange={(value) =>
              setPay({ ...pay, reference: value })
            }
          />
          <div className="flex items-end">
            <button
              disabled={!Number(invoice.balance)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Wallet size={14} />
              Record payment
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-2">
          {(data.payments || []).map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"
            >
              <span>
                <b>{item.receiptNumber}</b> · {item.method} · {formatDate(item.paymentDate)} · Recorded by {name(item.createdBy)}
              </span>
              <b>{money(item.amount)}</b>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" title="Refunds">
        <form
          onSubmit={doRefund}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <Field
            label="Refund amount"
            type="number"
            value={refund.amount}
            onChange={(value) =>
              setRefund({ ...refund, amount: value })
            }
          />
          <Field
            label="Method"
            value={refund.method}
            onChange={(value) =>
              setRefund({ ...refund, method: value })
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
            label="Reason"
            value={refund.reason}
            onChange={(value) =>
              setRefund({ ...refund, reason: value })
            }
          />
          <div className="flex items-end">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-600">
              <RotateCcw size={14} />
              Record refund
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-2">
          {(data.refunds || []).length ? (
            data.refunds.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap justify-between rounded-xl border border-slate-200 p-3 text-sm"
              >
                <span>
                  <b>{item.refundNumber}</b> · {item.reason}
                </span>
                <b>{money(item.amount)}</b>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">
              No refunds recorded.
            </div>
          )}
        </div>
      </Section>

      <Section number="06" title="Notes">
        {editing ? (
          <Field
            label="Notes"
            value={editForm?.notes || ""}
            onChange={(value) =>
              setEditForm((current) => ({
                ...current,
                notes: value,
              }))
            }
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {invoice.notes || "No notes recorded."}
          </p>
        )}
      </Section>

      <Section number="07" title="Audit trail">
        <InfoGrid
          items={[
            {
              label: "Created by",
              value: name(invoice.createdBy),
            },
            {
              label: "Created at",
              value: formatDateTime(invoice.createdAt),
            },
            {
              label: "Updated by",
              value: invoice.updatedBy
                ? name(invoice.updatedBy)
                : "Not updated yet",
            },
            {
              label: "Updated at",
              value: formatDateTime(invoice.updatedAt),
            },
            {
              label: "Discount updated by",
              value: invoice.discountUpdatedBy
                ? name(invoice.discountUpdatedBy)
                : "Not changed yet",
            },
            {
              label: "Discount updated at",
              value: formatDateTime(invoice.discountUpdatedAt),
            },
          ]}
        />
      </Section>
    </DocumentShell>
  );
}
