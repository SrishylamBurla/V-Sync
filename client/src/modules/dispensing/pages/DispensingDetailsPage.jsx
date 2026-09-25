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
import { DocumentShell, Field, InfoGrid, Section } from "../../../components/common/DocumentUI";
import { getDispensing, updateDispensing } from "../dispensing.api";
import { addPayment, createInvoice } from "../../billing/billing.api";

const next = {
  draft: "ordered",
  ordered: "not_ready",
  not_ready: "ready",
  ready: "notified",
  notified: "collected",
};

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DispensingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [billOpen, setBillOpen] = useState(false);
  const [billMode, setBillMode] = useState("pay_later");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [creatingBill, setCreatingBill] = useState(false);
  const [billSuccess, setBillSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDispensing(id);
      setRecord(response?.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load dispensing job");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const total = useMemo(() => {
    if (!record) return 0;
    if (record.itemType === "Contact Lens") return Number(record.total || 0);
    const frame = Number(record.frame?.price || 0);
    const lens = Number(record.lens?.price || 0);
    const extras = (record.extras || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
    return Math.max(0, frame + lens + extras - Number(record.discount || 0));
  }, [record]);

  const advance = async () => {
    const target = next[record?.status];
    if (!record || !target) return;
    setSavingStatus(true);
    setError("");
    try {
      const response = await updateDispensing(id, target);
      setRecord(response?.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update dispensing status");
    } finally {
      setSavingStatus(false);
    }
  };

  const createBill = async (event) => {
    event.preventDefault();
    if (!record?.patientId?._id) {
      setError("Patient information is missing from this dispensing record");
      return;
    }

    const amount = billMode === "pay_full" ? total : Number(paymentAmount || 0);
    if (billMode === "partial" && (amount <= 0 || amount >= total)) {
      setError("Partial payment must be greater than zero and less than the bill total");
      return;
    }

    setCreatingBill(true);
    setError("");
    try {
      const items = record.itemType === "Spectacle"
        ? [
            ...(record.frame?.price ? [{ description: `Frame ${record.frame.code || record.frame.description || ""}`.trim(), category: "spectacle", quantity: 1, unitPrice: Number(record.frame.price || 0), discount: Number(record.frame.discount || 0), referenceId: record._id }] : []),
            ...(record.lens?.price ? [{ description: `Lens ${record.lens.code || record.lens.description || ""}`.trim(), category: "spectacle", quantity: 1, unitPrice: Number(record.lens.price || 0), discount: 0, referenceId: record._id }] : []),
            ...(record.extras || []).filter((item) => Number(item.price || 0) > 0).map((item) => ({ description: item.name || item.description || "Optical extra", category: "sundry", quantity: 1, unitPrice: Number(item.price || 0), discount: 0, referenceId: record._id })),
          ]
        : [{ description: `${record.brand || record.lensType || "Contact lens"} ${record.model || ""}`.trim(), category: "contact_lens", quantity: Number(record.quantity || 1), unitPrice: Number(record.unitPrice || 0), discount: Number(record.discount || 0), referenceId: record._id }];

      const response = await createInvoice({
        patientId: record.patientId._id,
        dueDate: billMode === "pay_later" ? undefined : new Date().toISOString(),
        items,
        discount: record.itemType === "Spectacle" ? Number(record.discount || 0) : 0,
        tax: 0,
        notes: `Created from ${record.itemType} dispensing ${record.recordNumber}`,
      });

      const invoice = response?.data;
      if (!invoice?._id) throw new Error("Invoice was created without an invoice ID");

      if (amount > 0) {
        await addPayment(invoice._id, {
          amount,
          method: paymentMethod,
          reference: paymentReference,
          notes: billMode === "pay_full" ? "Paid at dispensing" : "Partial payment at dispensing",
        });
      }

      setBillSuccess(invoice.invoiceNumber);
      setBillOpen(false);
      setTimeout(() => navigate(`/billing/${invoice._id}`), 700);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to create bill");
    } finally {
      setCreatingBill(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400"><Loader2 size={18} className="mr-2 animate-spin" />Loading dispensing record...</div>;
  }

  if (!record) {
    return <div className="mx-auto max-w-3xl py-16"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Dispensing record not found"}</div></div>;
  }

  const patient = record.patientId;
  const isSpectacle = record.itemType === "Spectacle";

  return (
    <>
      <DocumentShell
        eyebrow="Operations · Dispensing"
        title={record.recordNumber}
        subtitle={`${record.itemType} · ${patientName(patient)}`}
        code="DISPENSING"
        status={label(record.status)}
        actions={
          <>
            <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"><ArrowLeft size={14} /> Back</button>
            <button type="button" onClick={() => setBillOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white"><Receipt size={14} /> Create Bill</button>
            {next[record.status] && <button type="button" disabled={savingStatus} onClick={() => void advance()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 disabled:opacity-50"><CheckCircle2 size={14} /> {savingStatus ? "Updating..." : label(next[record.status])}</button>}
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"><Printer size={14} /> Print</button>
          </>
        }
      >
        {error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
        {billSuccess && <div className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">Bill {billSuccess} created successfully. Opening invoice...</div>}

        <Section number="01" title="Patient">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <InfoGrid items={[{ label: "Patient", value: patientName(patient) }, { label: "Patient number", value: patient?.patientNumber }, { label: "Date of birth", value: patient?.dateOfBirth || patient?.dob ? new Date(patient.dateOfBirth || patient.dob).toLocaleDateString("en-IN") : "—" }, { label: "Phone", value: patient?.phone || "—" }]} />
            <div className="flex flex-wrap items-start gap-2"><button type="button" onClick={() => navigate(`/patients/${patient?._id}`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white"><UserRound size={14} /> Patient workspace</button>{patient?.phone && <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600"><Phone size={14} /> Call</a>}</div>
          </div>
        </Section>

        <Section number="02" title="Job information">
          <InfoGrid items={[{ label: "Type", value: record.itemType }, { label: "Job / order number", value: record.recordNumber }, { label: "Order date", value: record.orderDate || record.jobDate ? new Date(record.orderDate || record.jobDate).toLocaleDateString("en-IN") : "—" }, { label: "Due date", value: record.dueDate ? new Date(record.dueDate).toLocaleDateString("en-IN") : "—" }, { label: "Status", value: label(record.status) }]} />
        </Section>

        {isSpectacle ? (
          <>
            <Section number="03" title="Optical dispensing details">
              <div className="grid gap-5 xl:grid-cols-2">
                <DetailCard title="Frame" icon={Glasses} items={[{ label: "Code", value: record.frame?.code }, { label: "Description", value: record.frame?.description }, { label: "Size", value: record.frame?.size }, { label: "Type", value: record.frame?.type }, { label: "Fitting", value: record.frame?.fitting }, { label: "Price", value: money(record.frame?.price) }]} />
                <DetailCard title="Lens" icon={EyeIcon} items={[{ label: "Code", value: record.lens?.code }, { label: "Description", value: record.lens?.description }, { label: "Supplier", value: record.lens?.supplier }, { label: "Price", value: money(record.lens?.price) }]} />
              </div>
              {record.extras?.length > 0 && <div className="mt-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Extras</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{record.extras.map((item, index) => <div key={item._id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs font-bold text-slate-800">{item.name || item.description || "Extra"}</div><div className="mt-1 text-xs font-semibold text-slate-600">{money(item.price)}</div></div>)}</div></div>}
            </Section>

            <Section number="04" title="Prescription">
              <RxTable rx={record.rx} pd={record.pd} />
            </Section>
          </>
        ) : (
          <Section number="03" title="Contact lens dispensing details">
            <InfoGrid items={[{ label: "Lens type", value: record.lensType }, { label: "Brand", value: record.brand }, { label: "Model", value: record.model }, { label: "Supplier", value: record.supplier }, { label: "Replacement", value: record.replacement }, { label: "Quantity", value: record.quantity }, { label: "Unit price", value: money(record.unitPrice) }, { label: "Discount", value: money(record.discount) }]} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><DetailCard title="Right eye" items={[{ label: "Power", value: record.right?.power }, { label: "Sphere", value: record.right?.sphere }, { label: "Cylinder", value: record.right?.cylinder }, { label: "Axis", value: record.right?.axis }, { label: "BC", value: record.right?.bc }, { label: "DIA", value: record.right?.dia }]} /><DetailCard title="Left eye" items={[{ label: "Power", value: record.left?.power }, { label: "Sphere", value: record.left?.sphere }, { label: "Cylinder", value: record.left?.cylinder }, { label: "Axis", value: record.left?.axis }, { label: "BC", value: record.left?.bc }, { label: "DIA", value: record.left?.dia }]} /></div>
          </Section>
        )}

        <Section number={isSpectacle ? "05" : "04"} title="Financial summary">
          <div className="ml-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Frame</span><b>{money(record.frame?.price)}</b></div><div className="flex justify-between"><span className="text-slate-500">Lens</span><b>{money(record.lens?.price)}</b></div><div className="flex justify-between"><span className="text-slate-500">Extras</span><b>{money((record.extras || []).reduce((sum, item) => sum + Number(item.price || 0), 0))}</b></div><div className="flex justify-between"><span className="text-slate-500">Discount</span><b>{money(record.discount)}</b></div><div className="flex justify-between border-t border-slate-300 pt-3 text-lg"><b>Total</b><b>{money(total)}</b></div></div></div>
        </Section>

        <Section number={isSpectacle ? "06" : "05"} title="Workflow">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[{ label: "Ordered", value: record.orderDate || record.jobDate }, { label: "Ready", value: record.jobReadyAt }, { label: "Last notified", value: record.lastNotifiedAt }, { label: "Collected", value: record.collectedAt }, { label: "Notifications", value: record.notificationCount ?? 0 }].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div><div className="mt-2 text-xs font-bold text-slate-700">{typeof item.value === "number" ? item.value : item.value ? new Date(item.value).toLocaleDateString("en-IN") : "Pending"}</div></div>)}</div>
        </Section>

        <Section number={isSpectacle ? "07" : "06"} title="Notes"><p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">{record.notes || "No dispensing notes recorded."}</p></Section>
      </DocumentShell>

      {billOpen && <BillModal total={total} mode={billMode} setMode={setBillMode} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} reference={paymentReference} setReference={setPaymentReference} onClose={() => setBillOpen(false)} onSubmit={createBill} saving={creatingBill} />}
    </>
  );
}

function DetailCard({ title, icon: Icon, items }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600">{Icon ? <Icon size={15} /> : <FileText size={15} />}</div><div className="text-xs font-bold text-slate-900">{title}</div></div><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <div key={item.label}><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div><div className="mt-1 text-xs font-semibold text-slate-700">{item.value || "—"}</div></div>)}</div></div>;
}

function RxTable({ rx, pd }) {
  const rows = ["sphere", "cylinder", "axis", "add", "prism", "base", "va"];
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[650px] text-xs"><thead><tr className="bg-slate-50 text-left text-[9px] uppercase tracking-wider text-slate-400"><th className="p-3">Field</th><th className="p-3">OD</th><th className="p-3">OS</th></tr></thead><tbody>{rows.map((field) => <tr key={field} className="border-t border-slate-100"><td className="p-3 font-semibold text-slate-500">{label(field)}</td><td className="p-3">{rx?.right?.[field] || "—"}</td><td className="p-3">{rx?.left?.[field] || "—"}</td></tr>)}<tr className="border-t border-slate-100"><td className="p-3 font-semibold text-slate-500">PD</td><td className="p-3">{pd?.right || "—"}</td><td className="p-3">{pd?.left || "—"}</td></tr></tbody></table></div>;
}

function BillModal({ total, mode, setMode, paymentAmount, setPaymentAmount, paymentMethod, setPaymentMethod, reference, setReference, onClose, onSubmit, saving }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Billing</div><h2 className="mt-1 text-base font-bold text-slate-900">Create bill from dispensing</h2></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-400"><X size={15} /></button></div><form onSubmit={onSubmit} className="space-y-5 p-5"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bill total</div><div className="mt-1 text-2xl font-bold text-slate-950">{money(total)}</div></div><div className="grid gap-2 md:grid-cols-3">{[["pay_full", "Pay in full"], ["partial", "Partial payment"], ["pay_later", "Pay later"]].map(([value, labelText]) => <button key={value} type="button" onClick={() => { setMode(value); if (value === "pay_full") setPaymentAmount(String(total)); }} className={`rounded-xl border p-3 text-left ${mode === value ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><div className="text-xs font-bold">{labelText}</div><div className="mt-1 text-[9px] text-slate-400">{value === "pay_full" ? "Invoice is paid immediately" : value === "partial" ? "Take a deposit now" : "Keep the full amount outstanding"}</div></button>)}</div>{mode !== "pay_later" && <div className="grid gap-4 sm:grid-cols-3"><Field label="Amount" type="number" value={mode === "pay_full" ? total : paymentAmount} onChange={setPaymentAmount} /><Field label="Method" value={paymentMethod} onChange={setPaymentMethod} options={["cash", "card", "upi", "bank_transfer", "insurance", "other"]} /><Field label="Reference" value={reference} onChange={setReference} /></div>}<div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving && <Loader2 size={14} className="animate-spin" />}Create bill</button></div></form></div></div>;
}

function EyeIcon(props) { return <Glasses {...props} />; }
