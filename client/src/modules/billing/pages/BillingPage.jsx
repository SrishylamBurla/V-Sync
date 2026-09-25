import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  FileText,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addPayment,
  createInvoice,
  getBillingSummary,
  getInvoices,
} from "../billing.api";
import { getPatients, getPatient } from "../../patients/patient.api";
import { DocumentShell, Field, Section, Table } from "../../../components/common/DocumentUI";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

const emptyForm = (patientId = "") => ({
  patientId,
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  discount: 0,
  tax: 0,
  notes: "",
  paymentMode: "pay_later",
  paymentAmount: "",
  paymentMethod: "cash",
  paymentReference: "",
  items: [
    {
      description: "",
      category: "other",
      quantity: 1,
      unitPrice: "",
      discount: 0,
    },
  ],
});

export default function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get("patientId") || "";

  const [summary, setSummary] = useState({ invoiced: 0, paid: 0, outstanding: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(Boolean(queryPatientId));
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(() => emptyForm(queryPatientId));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, invoiceResponse] = await Promise.all([
        getBillingSummary(),
        getInvoices(),
      ]);
      setSummary(summaryResponse?.data || {});
      setRows(invoiceResponse?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadQueryPatient = async () => {
      if (!queryPatientId) return;
      try {
        const response = await getPatient(queryPatientId);
        const patient = response?.data?.patient || response?.data || response?.patient;
        if (!active || !patient) return;
        setForm((current) => ({ ...current, patientId: queryPatientId }));
        setPatientQuery(fullName(patient));
      } catch {
        // Patient search remains available if the query patient cannot be loaded.
      }
    };

    void loadQueryPatient();
    return () => {
      active = false;
    };
  }, [queryPatientId]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!patientQuery.trim()) {
        setPatients([]);
        return;
      }
      try {
        const response = await getPatients({
          page: 1,
          limit: 8,
          search: patientQuery.trim(),
          status: "active",
        });
        setPatients(response?.data?.patients || []);
      } catch {
        setPatients([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [patientQuery]);

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.invoiceNumber} ${fullName(row.patientId)} ${row.patientId?.patientNumber || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  const total = useMemo(
    () =>
      Math.max(
        0,
        form.items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity || 0) * Number(item.unitPrice || 0) -
            Number(item.discount || 0),
          0,
        ) -
          Number(form.discount || 0) +
          Number(form.tax || 0),
      ),
    [form.items, form.discount, form.tax],
  );

  const selectPatient = (patient) => {
    setForm((current) => ({ ...current, patientId: patient._id }));
    setPatientQuery(fullName(patient));
    setPatients([]);
  };

  const updateItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setPatientQuery("");
    setPatients([]);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.patientId) {
      setError("Select a patient before creating the invoice");
      return;
    }

    const items = form.items
      .filter((item) => item.description.trim())
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        discount: Number(item.discount || 0),
      }));

    if (!items.length) {
      setError("Add at least one billable item");
      return;
    }

    if (form.paymentMode === "partial") {
      const payment = Number(form.paymentAmount || 0);
      if (payment <= 0 || payment >= total) {
        setError("Partial payment must be greater than zero and less than the invoice total");
        return;
      }
    }

    if (form.paymentMode === "pay_full") {
      setForm((current) => ({ ...current, paymentAmount: String(total) }));
    }

    setSaving(true);
    setError("");

    try {
      const response = await createInvoice({
        patientId: form.patientId,
        invoiceDate: form.invoiceDate,
        dueDate: form.paymentMode === "pay_later" ? form.dueDate : form.dueDate || form.invoiceDate,
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        notes: form.notes,
        items,
      });

      const invoice = response?.data;
      if (!invoice?._id) throw new Error("Invoice was created but no invoice ID was returned");

      let paymentAmount = 0;
      if (form.paymentMode === "pay_full") paymentAmount = total;
      if (form.paymentMode === "partial") paymentAmount = Number(form.paymentAmount || 0);

      if (paymentAmount > 0) {
        await addPayment(invoice._id, {
          amount: paymentAmount,
          method: form.paymentMethod,
          reference: form.paymentReference,
          notes: form.paymentMode === "pay_full" ? "Payment received at invoice creation" : "Partial payment received at invoice creation",
        });
      }

      resetForm();
      setShow(false);
      await load();
      navigate(`/billing/${invoice._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocumentShell
      eyebrow="Finance"
      title="Billing & Payments"
      subtitle="Create invoices, collect full or partial payments, and manage outstanding balances from one workflow."
      code="FINANCE"
      actions={
        <>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Printer size={14} /> Print
          </button>
          <button type="button" onClick={() => setShow((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus size={14} /> Create bill
          </button>
        </>
      }
    >
      {error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}

      <Section number="01" title="Financial summary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={FileText} label="Invoiced" value={money(summary.invoiced)} />
          <Metric icon={Wallet} label="Paid" value={money(summary.paid)} />
          <Metric icon={Clock3} label="Outstanding" value={money(summary.outstanding)} />
          <Metric icon={Receipt} label="Invoices" value={rows.length} />
        </div>
      </Section>

      {show && (
        <Section number="02" title="Create bill" description="Choose one of three payment outcomes: pay in full, take a partial payment, or leave the invoice outstanding for later payment.">
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative xl:col-span-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span>
                  <input required value={patientQuery} onChange={(event) => { setPatientQuery(event.target.value); setForm((current) => ({ ...current, patientId: "" })); }} placeholder="Search patient name, phone or number" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" />
                </label>
                {patients.length > 0 && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{patients.map((patient) => <button type="button" key={patient._id} onClick={() => selectPatient(patient)} className="flex w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><span className="text-xs font-semibold">{fullName(patient)}</span><span className="ml-2 text-[10px] text-slate-400">{patient.patientNumber} · {patient.phone || "No phone"}</span></button>)}</div>}
              </div>
              <Field label="Invoice date" type="date" value={form.invoiceDate} onChange={(value) => setForm({ ...form, invoiceDate: value })} />
              <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-2">Description</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit price</th><th className="px-3 py-2">Discount</th><th className="px-3 py-2 text-right">Line total</th><th /></tr></thead>
                <tbody>{form.items.map((item, index) => <tr key={index} className="border-b border-slate-100 last:border-0"><td className="p-2"><input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs" placeholder="Consultation, spectacle, contact lens..." /></td><td className="p-2"><select value={item.category} onChange={(event) => updateItem(index, "category", event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-xs"><option value="consultation">Consultation</option><option value="spectacle">Spectacle</option><option value="contact_lens">Contact lens</option><option value="sundry">Sundry</option><option value="other">Other</option></select></td><td className="p-2"><input type="number" min="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} className="h-10 w-20 rounded-lg border border-slate-200 px-3 text-xs" /></td><td className="p-2"><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", event.target.value)} className="h-10 w-28 rounded-lg border border-slate-200 px-3 text-xs" /></td><td className="p-2"><input type="number" min="0" value={item.discount} onChange={(event) => updateItem(index, "discount", event.target.value)} className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-xs" /></td><td className="p-2 text-right text-xs font-bold">{money(Number(item.quantity || 0) * Number(item.unitPrice || 0) - Number(item.discount || 0))}</td><td className="p-2"><button type="button" disabled={form.items.length === 1} onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} className="text-[10px] font-semibold text-red-500 disabled:opacity-30">Remove</button></td></tr>)}</tbody>
              </table>
            </div>

            <button type="button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, { description: "", category: "other", quantity: 1, unitPrice: "", discount: 0 }] }))} className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">+ Add line</button>

            <div className="grid gap-4 md:grid-cols-3"><Field label="Invoice discount" type="number" value={form.discount} onChange={(value) => setForm({ ...form, discount: value })} /><Field label="Tax" type="number" value={form.tax} onChange={(value) => setForm({ ...form, tax: value })} /><Field label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} /></div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment at bill creation</div>
              <div className="grid gap-2 md:grid-cols-3">
                {[['pay_full', 'Pay in full', 'Invoice becomes PAID'], ['partial', 'Partial payment', 'Record a deposit and keep balance'], ['pay_later', 'Pay later', 'Create invoice with outstanding balance']].map(([value, label, description]) => <button key={value} type="button" onClick={() => setForm({ ...form, paymentMode: value, paymentAmount: value === "pay_full" ? String(total) : form.paymentAmount })} className={`rounded-xl border p-3 text-left ${form.paymentMode === value ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><div className="text-xs font-bold text-slate-900">{label}</div><div className="mt-1 text-[9px] text-slate-400">{description}</div></button>)}
              </div>

              {form.paymentMode !== "pay_later" && <div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Amount received" type="number" value={form.paymentMode === "pay_full" ? total : form.paymentAmount} onChange={(value) => setForm({ ...form, paymentAmount: value })} /><Field label="Payment method" value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value })} options={["cash", "card", "upi", "bank_transfer", "insurance", "other"]} /><Field label="Reference" value={form.paymentReference} onChange={(value) => setForm({ ...form, paymentReference: value })} /></div>}
            </div>

            <div className="flex flex-col items-end gap-3 border-t border-slate-200 pt-4"><div className="text-xl font-bold text-slate-900">Total {money(total)}</div><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{saving && <RefreshCw size={14} className="animate-spin" />}Create bill</button></div>
          </form>
        </Section>
      )}

      <Section number={show ? "03" : "02"} title="Invoice register">
        <div className="relative mb-5 max-w-xl"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice, patient or patient number..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-400" /></div>
        {loading ? <div className="py-12 text-center text-sm text-slate-400">Loading invoices...</div> : <Table columns={[{ key: "invoice", label: "Invoice", render: (row) => <div><div className="font-semibold text-slate-900">{row.invoiceNumber}</div><div className="text-[10px] text-slate-400">{new Date(row.invoiceDate).toLocaleDateString("en-IN")}</div></div> }, { key: "patient", label: "Patient", render: (row) => <button type="button" onClick={() => navigate(`/patients/${row.patientId?._id}`)} className="text-left font-semibold hover:underline">{fullName(row.patientId)}<div className="text-[10px] font-normal text-slate-400">{row.patientId?.patientNumber}</div></button> }, { key: "total", label: "Total", render: (row) => money(row.total) }, { key: "paid", label: "Paid", render: (row) => money(row.paidAmount) }, { key: "balance", label: "Balance", render: (row) => <span className={Number(row.balance) > 0 ? "font-bold text-amber-700" : "font-semibold text-emerald-700"}>{money(row.balance)}</span> }, { key: "status", label: "Status", render: (row) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase">{String(row.status || "issued").replaceAll("_", " ")}</span> }, { key: "open", label: "", align: "right", render: (row) => <button type="button" onClick={() => navigate(`/billing/${row._id}`)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">Open <ArrowRight size={13} /></button> }]} rows={filtered} empty="No invoices found." />}
      </Section>
    </DocumentShell>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon size={16} /></div><div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-lg font-bold text-slate-900">{value}</div></div></div></div>;
}
