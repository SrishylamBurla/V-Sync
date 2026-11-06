import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  DocumentShell,
  Field,
  Section,
  Table,
} from "../../../components/common/DocumentUI";
import {
  getInventoryReport,
  getOperationalReports,
  getReportOverview,
} from "../reports.api";
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const startMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};
const label = (s) =>
  String(s || "Other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function ReportsPage() {
  const [range, setRange] = useState({
    from: iso(startMonth()),
    to: iso(new Date()),
  });

  const [data, setData] = useState(null);
  const [op, setOp] = useState(null);
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!range.from || !range.to) {
      setError("Please select both report dates.");
      return;
    }

    if (range.from > range.to) {
      setError("The start date cannot be after the end date.");
      return;
    }

    setRunning(true);
    setError("");

    try {
      const [overviewResponse, operationalResponse, inventoryResponse] =
        await Promise.all([
          getReportOverview(range),
          getOperationalReports(range),
          getInventoryReport(),
        ]);

      setData(overviewResponse?.data || null);
      setOp(operationalResponse?.data || null);
      setInv(inventoryResponse?.data || null);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load reports.",
      );
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const overview = data || {};
  const counts = overview.counts || {};
  const financial = overview.financial || {};
  const daily = Array.isArray(overview.daily) ? overview.daily : [];
  const paymentByMethod = Array.isArray(overview.paymentByMethod)
    ? overview.paymentByMethod
    : [];
  const appointmentStatuses = Array.isArray(overview.appointmentStatuses)
    ? overview.appointmentStatuses
    : [];
  const revenueByCategory = Array.isArray(overview.revenueByCategory)
    ? overview.revenueByCategory
    : [];

  const operations = op || {};
  const inventory = inv || {};
  const lowStock = Array.isArray(inventory.lowStock) ? inventory.lowStock : [];

  const totalActivity = useMemo(
    () =>
      Number(counts.appointments || 0) +
      Number(counts.consultations || 0) +
      Number(counts.spectacles || 0) +
      Number(counts.contactLenses || 0),
    [counts],
  );

  const collectionRate = useMemo(() => {
    const invoiced = Number(financial.invoiceTotal || 0);
    const paid = Number(financial.paid || 0);
    return invoiced > 0 ? Math.round((paid / invoiced) * 100) : 0;
  }, [financial]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...daily.map((x) => Number(x.value || 0))),
    [daily],
  );

  const exportCsv = useCallback(() => {
    const rows = [
      ["Report period", range.from, range.to],
      [],
      ["Practice overview", "Value"],
      ["Active patients", counts.patients || 0],
      ["Appointments", counts.appointments || 0],
      ["Consultations", counts.consultations || 0],
      ["Spectacle jobs", counts.spectacles || 0],
      ["Contact lens jobs", counts.contactLenses || 0],
      ["Recall due", counts.recallDue || 0],
      [],
      ["Financial performance", "Value"],
      ["Invoiced", financial.invoiceTotal || 0],
      ["Collected", financial.paid || 0],
      ["Outstanding", financial.outstanding || 0],
      [],
      ["Inventory", "Value"],
      ["Active items", inventory.total || 0],
      ["Low stock", lowStock.length],
      ["Cost value", inventory.costValue || 0],
      ["Retail value", inventory.retailValue || 0],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = cell == null ? "" : String(cell);
            return `"${value.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `v-sync-report-${range.from}-${range.to}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [counts, financial, inventory, lowStock, range]);

  const setPreset = (preset) => {
    const today = new Date();

    if (preset === "today") {
      const value = iso(today);
      setRange({ from: value, to: value });
      return;
    }

    if (preset === "month") {
      setRange({
        from: iso(startMonth()),
        to: iso(today),
      });
      return;
    }

    if (preset === "lastMonth") {
      const firstThisMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const lastMonthEnd = new Date(firstThisMonth - 1);
      const lastMonthStart = new Date(
        lastMonthEnd.getFullYear(),
        lastMonthEnd.getMonth(),
        1,
      );

      setRange({
        from: iso(lastMonthStart),
        to: iso(lastMonthEnd),
      });
      return;
    }

    if (preset === "quarter") {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const quarterStart = new Date(
        today.getFullYear(),
        quarterStartMonth,
        1,
      );

      setRange({
        from: iso(quarterStart),
        to: iso(today),
      });
    }
  };

  return (
    <DocumentShell
      eyebrow="Business intelligence"
      title="Reports & Statistics"
      subtitle="Operational, clinical, optical, inventory and financial reporting in one workspace."
      code="REPORTS"
      actions={
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={load}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={running ? "animate-spin" : ""} />
            {running ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={14} />
            Print
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      }
    >
      {error && (
        <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 sm:mx-7">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <Section
        number="01"
        title="Report period"
        description="Choose the inclusive period used for clinical, operational and financial calculations."
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Field
              label="From"
              type="date"
              value={range.from}
              onChange={(value) => setRange((current) => ({ ...current, from: value }))}
            />
            <Field
              label="To"
              type="date"
              value={range.to}
              onChange={(value) => setRange((current) => ({ ...current, to: value }))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["today", "Today"],
              ["month", "This month"],
              ["lastMonth", "Last month"],
              ["quarter", "This quarter"],
            ].map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {value}
              </button>
            ))}

            <button
              type="button"
              onClick={load}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              <BarChart3 size={14} />
              Run reports
            </button>
          </div>
        </div>
      </Section>

      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto animate-spin text-slate-300" size={24} />
          <p className="mt-2 text-xs font-semibold text-slate-600">Building reports...</p>
          <p className="mt-1 text-[11px] text-slate-400">Collecting data for the selected period.</p>
        </div>
      ) : (
        <div className="space-y-3 px-3 pb-3 sm:px-4">
          {/* Practice snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Practice overview</h2>
              <span className="text-[10px] text-slate-400">{range.from} – {range.to}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Metric compact icon={Users} label="Active patients" value={counts.patients || 0} accent="blue" />
              <Metric compact icon={CalendarDays} label="Appointments" value={counts.appointments || 0} accent="violet" />
              <Metric compact icon={Activity} label="Consultations" value={counts.consultations || 0} accent="emerald" />
              <Metric compact icon={ClipboardList} label="Spectacle jobs" value={counts.spectacles || 0} accent="amber" />
              <Metric compact icon={Package} label="Contact lens" value={counts.contactLenses || 0} accent="rose" />
              <Metric compact icon={CalendarDays} label="Recall due" value={counts.recallDue || 0} accent="cyan" />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
              <span className="font-medium text-slate-500">Total tracked clinical & optical activity</span>
              <strong className="text-slate-800">{totalActivity.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          {/* Financial snapshot and charts */}
          <div className="grid gap-3 xl:grid-cols-12">
            <section className="rounded-xl border border-slate-200 bg-white p-3 xl:col-span-5">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Financial performance</h2>
              <div className="grid grid-cols-2 gap-2">
                <Metric compact icon={WalletCards} label="Invoiced" value={money(financial.invoiceTotal)} accent="blue" />
                <Metric compact icon={CheckCircle2} label="Collected" value={money(financial.paid)} accent="emerald" />
                <Metric compact icon={TrendingUp} label="Outstanding" value={money(financial.outstanding)} accent="amber" />
                <Metric compact icon={BarChart3} label="Collection rate" value={`${collectionRate}%`} accent="violet" />
              </div>
            </section>
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-7">
              <Chart title="Revenue by day" rows={daily.map((x) => ({ label: x._id, value: x.value }))} max={maxRevenue} />
              <SimpleBars title="Payment methods" rows={paymentByMethod} moneyValues={false} />
            </div>
          </div>

          {/* Operations */}
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Clinical & operational statistics</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <SimpleBars title="Appointment status" rows={appointmentStatuses} compact />
                <SimpleBars title="Revenue by category" rows={revenueByCategory} moneyValues compact />
                <SimpleBars title="Appointment types" rows={operations.appointments || []} compact />
                <SimpleBars title="Consultation types" rows={operations.consultations || []} compact />
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Optical & dispensing</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <SimpleBars title="Spectacle workflow" rows={operations.spectacles || []} compact />
                <SimpleBars title="Contact lens workflow" rows={operations.contactLenses || []} compact />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Metric compact icon={ClipboardList} label="Recall lists created" value={operations.recalls?.lists || 0} accent="blue" />
                <Metric compact icon={Users} label="Patients selected for recall" value={operations.recalls?.selected || 0} accent="violet" />
              </div>
            </section>
          </div>

          {/* Inventory */}
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Inventory statistics</h2>
              <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{lowStock.length} low-stock</span>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric compact icon={Package} label="Active items" value={inventory.total || 0} accent="blue" />
              <Metric compact icon={Activity} label="Low stock" value={lowStock.length} accent="rose" />
              <Metric compact icon={WalletCards} label="Cost value" value={money(inventory.costValue)} accent="amber" />
              <Metric compact icon={TrendingUp} label="Retail value" value={money(inventory.retailValue)} accent="emerald" />
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-100">
              <Table
                columns={[
                  { key: "code", label: "Code" },
                  { key: "name", label: "Item" },
                  { key: "category", label: "Category", render: (r) => label(r.category) },
                  { key: "stock", label: "Stock" },
                  { key: "reorder", label: "Reorder" },
                ]}
                rows={lowStock}
                empty="No low-stock items."
              />
            </div>
          </section>
          <p className="px-1 text-[10px] leading-4 text-slate-400">Reports use the current organization's invoice, payment, appointment, consultation, optical job, recall and inventory records.</p>
        </div>
      )}

    </DocumentShell>
  );
}

function Metric({ icon: Icon, label, value, accent = "slate", compact = false }) {
  const styles = {
    blue: "from-blue-50 to-cyan-50 text-blue-700",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    amber: "from-amber-50 to-orange-50 text-amber-700",
    rose: "from-rose-50 to-pink-50 text-rose-700",
    cyan: "from-cyan-50 to-sky-50 text-cyan-700",
    slate: "from-slate-50 to-slate-100 text-slate-700",
  };

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${compact ? "p-2" : "p-3"}`}>
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${styles[accent] || styles.slate}`}>
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-0.5 break-words text-base font-bold leading-tight tracking-tight text-slate-900">
        {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleBars({ title, rows = [], moneyValues = false, compact = false }) {
  const normalized = Array.isArray(rows) ? rows : [];
  const max = Math.max(
    1,
    ...normalized.map((x) => Number(x.value ?? x.count ?? 0)),
  );

  return (
    <div className={`rounded-lg border border-slate-100 bg-slate-50/60 ${compact ? "p-2" : "p-3"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
        <BarChart3 size={15} className="text-slate-300" />
      </div>

      <div className={compact ? "space-y-2" : "space-y-3"}>
        {normalized.length ? (
          normalized.map((r, i) => {
            const v = Number(r.value ?? r.count ?? 0);
            return (
              <div key={`${r._id ?? "row"}-${i}`}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                  <span className="min-w-0 truncate font-semibold text-slate-700">
                    {label(r._id)}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-500">
                    {moneyValues ? money(v) : v.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-800 transition-all"
                    style={{ width: `${Math.max(3, (v / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-400">
            No data for this period.
          </div>
        )}
      </div>
    </div>
  );
}

function Chart({ title, rows = [], max = 1 }) {
  const normalized = Array.isArray(rows) ? rows : [];

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
        <TrendingUp size={15} className="text-slate-300" />
      </div>

      <div className="space-y-2">
        {normalized.length ? (
          normalized.slice(-14).map((r, i) => (
            <div
              key={`${r.label}-${i}`}
              className="grid grid-cols-[52px_1fr_76px] items-center gap-1.5 text-[10px]"
            >
              <span className="truncate text-slate-400">
                {String(r.label || "").slice(5)}
              </span>

              <div className="h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all"
                  style={{
                    width: `${Math.max(3, (Number(r.value || 0) / max) * 100)}%`,
                  }}
                />
              </div>

              <span className="text-right font-semibold text-slate-700">
                {money(r.value)}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-400">
            No invoices in this period.
          </div>
        )}
      </div>
    </div>
  );
}
