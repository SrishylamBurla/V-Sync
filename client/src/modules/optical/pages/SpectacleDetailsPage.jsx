import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Glasses,
  Printer,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getSpectacle, updateSpectacle } from "../spectacle.api";

const NEXT_ACTIONS = {
  draft: ["ordered", "cancelled"],
  ordered: ["not_ready", "cancelled"],
  not_ready: ["ready", "cancelled"],
  ready: ["notified", "collected"],
  notified: ["collected"],
  collected: [],
  cancelled: [],
};

const pretty = (value) =>
  value
    ? String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmt = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Patient";

const getLensRows = (job) => {
  if (Array.isArray(job?.lensRows) && job.lensRows.length) {
    return job.lensRows;
  }

  if (Array.isArray(job?.lenses) && job.lenses.length) {
    return job.lenses;
  }

  if (job?.lens?.right || job?.lens?.left) {
    return [
      { eye: "R", ...(job.lens.right || {}) },
      { eye: "L", ...(job.lens.left || {}) },
    ];
  }

  if (job?.lens) {
    return [{ eye: "R/L", ...job.lens }];
  }

  return [];
};

export default function SpectacleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSpectacle(id);
      setJob(response?.data?.spectacle || response?.data || response?.spectacle || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load spectacle job.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (status) => {
    try {
      setUpdating(true);
      setError("");
      const response = await updateSpectacle(id, { status });
      setJob(response?.data?.spectacle || response?.data || response?.spectacle || job);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update spectacle job.");
    } finally {
      setUpdating(false);
    }
  };

  const lensRows = useMemo(() => getLensRows(job), [job]);
  const frame = job?.frame || {};
  const dispensing = job?.dispensing || {};
  const extras = Array.isArray(job?.extras) ? job.extras : [];

  const framePrice = Number(job?.framePrice ?? frame.price ?? dispensing.toReorder ?? 0);
  const lensPrice = Number(
    job?.lensPrice ??
      job?.lens?.price ??
      lensRows.reduce((sum, row) => sum + Number(row?.lensPrice ?? row?.price ?? 0), 0),
  );
  const extrasTotal = Number(
    job?.extrasTotal ??
      extras.reduce((sum, item) => sum + Number(item?.price || 0), 0),
  );
  const discount = Number(
    job?.discount ??
      dispensing.overallDiscount ??
      dispensing.frameDiscount ??
      0,
  );
  const total = Number(
    job?.total ??
      Math.max(0, framePrice + lensPrice + extrasTotal - discount),
  );
  const gst = Number(job?.gst ?? dispensing.gst ?? 0);
  const billTotal = Number(job?.billTotal ?? total + gst);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading spectacle record...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Spectacle job not found."}
        </div>
      </div>
    );
  }

  const patient = job.patientId || job.patient || {};
  const name = patientName(patient);
  const jobNumber = job.jobNumber || job.jobNo || job._id || "Spectacle Job";
  const status = job.status || "draft";
  const rx = job.rx || job.prescription || job.givenRx || {};

  return (
    <div className="min-h-full bg-[#f4f8fc] p-3 sm:p-5 lg:p-7 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patient?._id || ""}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Patient record
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <Printer size={15} />
              Print job
            </button>
          </div>
        </div>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <Glasses size={21} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-200">
                      Dispensing · Spectacle
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">
                      Spectacle Details
                    </h1>
                    <p className="mt-1 text-xs text-slate-300">{jobNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <StatusBadge status={status} />
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-right">
                  <div className="text-[9px] font-semibold uppercase tracking-[.15em] text-slate-400">
                    Patient No.
                  </div>
                  <div className="mt-0.5 text-sm font-semibold">
                    {patient.patientNumber || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <HeaderInfo label="Patient" value={name} />
              <HeaderInfo label="Job date" value={fmt(job.jobDate || job.orderDate || job.createdAt)} />
              <HeaderInfo label="Spec due" value={fmt(job.dueDate || job.specDue)} />
              <HeaderInfo label="Phone" value={patient.phone || patient.mobile} />
            </div>
          </header>

          {error && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 sm:mx-8">
              {error}
            </div>
          )}

          <main className="divide-y divide-slate-200">
            <Section number="01" title="Job & prescription">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Job date" value={fmt(job.jobDate || job.orderDate)} />
                <Info label="Spec due" value={fmt(job.dueDate || job.specDue)} />
                <Info label="Rx date" value={fmt(job.rxDate || rx.date)} />
                <Info label="Rx by" value={job.rxBy || job.prescribedBy || job.optometristId?.name || "—"} />
                <Info label="Use" value={job.use || job.usage || dispensing.use || "—"} />
                <Info label="Job type" value={pretty(job.jobType || job.type || "Spectacle")} />
                <Info label="Dispenser" value={job.dispenser || job.dispenserId?.name || "—"} />
                <Info label="Billing No." value={job.billingNo || job.billNo || dispensing.billNo} />
              </div>

              <div className="mt-5">
                <RxTable rx={rx} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Info label="Right PD" value={job.pd?.right || rx.pd?.right || job.pdRight} />
                <Info label="Left PD" value={job.pd?.left || rx.pd?.left || job.pdLeft} />
                <Info label="Total PD" value={job.pd?.total || rx.pd?.total || job.pdTotal} />
              </div>

              {job.rx?.note && <Note label="Rx comment" value={job.rx.note} />}
            </Section>

            <Section number="02" title="Frame details">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Frame code" value={frame.code || frame.frameCode || job.frameCode || dispensing.frameCode} />
                <Info label="Description" value={frame.description || job.frameDescription || dispensing.frameDescription} />
                <Info label="Size" value={frame.size || job.frameSize || dispensing.frameSize} />
                <Info label="Depth" value={frame.depth || job.depth || dispensing.depth} />
                <Info label="ED" value={frame.ed || job.ed || dispensing.ed} />
                <Info label="Frame type" value={frame.type || job.frameType || dispensing.frameType} />
                <Info label="Fitting" value={frame.fitting || job.fitting || dispensing.fitting} />
                <Info label="Other" value={frame.other || job.frameOther || dispensing.other} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MoneyInfo label="Frame price" value={framePrice} />
                <MoneyInfo label="Frame discount" value={job.frameDiscount ?? dispensing.frameDiscount} />
                <MoneyInfo label="To reorder" value={job.toReorder ?? dispensing.toReorder} />
              </div>
            </Section>

            <Section number="03" title="Lens details">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1200px] border-collapse text-left text-[11px]">
                  <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
                    <tr>
                      {[
                        "Eye",
                        "Lens Code",
                        "Lens Description",
                        "Size",
                        "Seg Size",
                        "Seg Ht",
                        "OC Ht",
                        "Hor Decen",
                        "Ver Decen",
                        "BC",
                        "Supplier",
                        "Order Date",
                        "Price",
                      ].map((heading) => (
                        <th key={heading} className="border-b border-slate-200 px-3 py-3 whitespace-nowrap">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lensRows.length ? (
                      lensRows.map((row, index) => (
                        <tr key={row._id || `${row.eye || "lens"}-${index}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                          <td className="px-3 py-3 font-bold text-slate-800">{row.eye || row.side || "—"}</td>
                          <td className="px-3 py-3 font-semibold text-slate-700">{row.lensCode || row.code || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.lensDescription || row.description || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.lensSize || row.size || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.segSize || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.segHeight || row.segHt || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.ocHeight || row.ocHt || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.horizontalDecentration || row.horDecen || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.verticalDecentration || row.verDecen || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{row.baseCurve || row.bc || "—"}</td>
                          <td className="px-3 py-3 font-medium text-slate-600">{row.lensSupplier || row.supplier || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{fmt(row.supplierOrderDate || row.orderDate)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-800">₹{money(row.lensPrice ?? row.price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={13} className="px-4 py-10 text-center text-xs text-slate-400">
                          No detailed lens rows recorded for this job.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section number="04" title="Extras & lab instructions">
              <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[600px] text-left text-[11px]">
                      <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
                        <tr>
                          <th className="px-3 py-3">Extra</th>
                          <th className="px-3 py-3">Supplier</th>
                          <th className="px-3 py-3 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extras.length ? extras.map((item, index) => (
                          <tr key={item._id || index} className="border-t border-slate-100">
                            <td className="px-3 py-3 font-semibold text-slate-700">{item.description || item.name || "Extra"}</td>
                            <td className="px-3 py-3 text-slate-500">{item.supplier || "—"}</td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-700">₹{money(item.price)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={3} className="px-3 py-8 text-center text-xs text-slate-400">No extras recorded.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <Info label="Lab to apply" value={job.labToApply || job.lab || dispensing.labToApply} />
                  <Info label="Lab to fit" value={job.labToFit || dispensing.labToFit} />
                  <Info label="Discount reason" value={job.discountReason || dispensing.discountReason} />
                  <Note label="Lab instructions" value={job.labInstructions || job.labInstruction || dispensing.labInstructions || "No laboratory instructions recorded."} />
                </div>
              </div>
            </Section>

            <Section number="05" title="Financial summary">
              <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MoneyInfo label="Frame" value={framePrice} />
                  <MoneyInfo label="Lenses" value={lensPrice} />
                  <MoneyInfo label="Extras" value={extrasTotal} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <SummaryLine label="Frame" value={framePrice} />
                  <SummaryLine label="Lenses" value={lensPrice} />
                  <SummaryLine label="Extras" value={extrasTotal} />
                  <SummaryLine label="Discount" value={discount} prefix="−" />
                  <div className="my-3 border-t border-slate-200" />
                  <SummaryLine label="Total" value={total} strong />
                  <SummaryLine label="GST" value={gst} />
                  <div className="mt-3 rounded-xl bg-slate-950 px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Bill Total</span>
                      <span className="text-lg font-bold">₹{money(billTotal)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Billing No.</span>
                    <span className="font-semibold text-slate-600">{job.billingNo || job.billNo || dispensing.billNo || "Not linked"}</span>
                  </div>
                </div>
              </div>
            </Section>

            <Section number="06" title="Dispensing workflow">
              <div className="grid gap-3 md:grid-cols-5">
                <WorkflowDate label="Ordered" value={job.lensOrderDate || job.orderedAt || job.orderDate} />
                <WorkflowDate label="Job ready" value={job.jobReadyAt || job.readyAt} />
                <WorkflowDate label="Notified" value={job.lastNotifiedAt || job.notifiedAt} />
                <WorkflowDate label="Collected" value={job.collectedAt || job.collectionDate} />
                <WorkflowDate label="Cancelled" value={job.cancelledAt} />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Current stage</div>
                    <div className="mt-1 text-sm font-bold text-slate-800">{pretty(status)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    {(NEXT_ACTIONS[status] || []).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={updating}
                        onClick={() => changeStatus(nextStatus)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        <Check size={13} />
                        {pretty(nextStatus)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section number="07" title="Notes">
              <Note value={job.notes || "No notes recorded for this job."} />
            </Section>
          </main>

          <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-400 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-slate-500">V-Sync · Spectacle Dispensing Record</span>
              <span>{jobNumber}</span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <section className="px-5 py-7 sm:px-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[9px] font-bold tracking-[.2em] text-slate-400">{number}</span>
        <span className="h-px w-5 bg-slate-200" />
        <h2 className="text-xs font-bold uppercase tracking-[.14em] text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function HeaderInfo({ label, value }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value || "—"}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-700">{value || "—"}</div>
    </div>
  );
}

function MoneyInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-800">₹{money(value)}</div>
    </div>
  );
}

function SummaryLine({ label, value, prefix = "", strong = false }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${strong ? "text-sm font-bold text-slate-900" : "text-xs"}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-700">{prefix}₹{money(value)}</span>
    </div>
  );
}

function WorkflowDate({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">{label}</div>
      <div className={`mt-1 text-xs font-bold ${value ? "text-slate-700" : "text-slate-300"}`}>{fmt(value)}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: "border-slate-200 bg-slate-100 text-slate-600",
    ordered: "border-blue-200 bg-blue-50 text-blue-700",
    not_ready: "border-amber-200 bg-amber-50 text-amber-700",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
    notified: "border-violet-200 bg-violet-50 text-violet-700",
    collected: "border-slate-200 bg-white/10 text-white",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] ${styles[status] || styles.draft}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {pretty(status)}
    </span>
  );
}

function RxTable({ rx }) {
  const columns = ["Sphere", "Cylinder", "Axis", "VA", "Add", "Inter", "Prism", "Base"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[760px] border-collapse text-[11px]">
        <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
          <tr>
            <th className="border-b border-slate-200 px-3 py-3 text-left">Eye</th>
            {columns.map((column) => (
              <th key={column} className="border-b border-slate-200 px-3 py-3 text-left">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["right", "left"].map((eye) => (
            <tr key={eye} className="border-t border-slate-100">
              <td className="bg-slate-50 px-3 py-3 font-bold uppercase text-slate-700">{eye === "right" ? "OD · Right" : "OS · Left"}</td>
              {[
                "sphere",
                "cylinder",
                "axis",
                "va",
                "add",
                "inter",
                "prism",
                "base",
              ].map((key) => (
                <td key={key} className="px-3 py-3 font-medium text-slate-700">{rx?.[eye]?.[key] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ label, value }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {label && <div className="mb-1 text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">{label}</div>}
      <div className="whitespace-pre-wrap text-xs leading-5 text-slate-600">{value || "—"}</div>
    </div>
  );
}


