import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Phone,
  Printer,
  RefreshCw,
  Settings2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DocumentShell,
  Field,
  Section,
  Table,
} from "../../../components/common/DocumentUI";
import {
  createRecallList,
  getCurrentRecallList,
  getRecallSettings,
  getRecallSummary,
  updateRecallEntry,
  updateRecallSettings,
} from "../recall.api";

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (date, days) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ") ||
  "Unknown patient";
const statusLabel = (s) =>
  String(s || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function RecallPage() {
  const nav = useNavigate();

  const [summary, setSummary] = useState([]);
  const [list, setList] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [range, setRange] = useState({
    fromDate: today(),
    toDate: plusDays(today(), 30),
    exclusionMonths: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, listResponse, settingsResponse] =
        await Promise.all([
          getRecallSummary(),
          getCurrentRecallList(),
          getRecallSettings(),
        ]);

      const summaryData = summaryResponse?.data;
      const listData = listResponse?.data;
      const settingsData = settingsResponse?.data;

      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setList(listData || null);
      setSettings(settingsData || null);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load recall management.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (list?.entries || []).filter((entry) => {
      const matchesSearch =
        !q ||
        [
          entry.patientName,
          entry.patientNumber,
          entry.phone,
          entry.email,
          entry.letter,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesStatus = !statusFilter || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [list, query, statusFilter]);

  const stats = useMemo(() => {
    const current = list?.entries || [];

    return {
      total: current.length,
      pending: current.filter((entry) => entry.status === "pending").length,
      printed: current.filter((entry) => entry.status === "printed").length,
      phoned: current.filter((entry) => entry.status === "phoned").length,
      held: current.filter((entry) => entry.status === "held").length,
    };
  }, [list]);

  const create = async (event) => {
    event.preventDefault();
    setWorking(true);
    setError("");

    if (range.fromDate > range.toDate) {
      setError("Start date cannot be after the end date.");
      setWorking(false);
      return;
    }

    try {
      const response = await createRecallList({
        ...range,
        exclusionMonths: Number(range.exclusionMonths || 0),
      });

      setNotice(response?.message || "Recall list created successfully.");
      setList(response?.data || null);
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to create recall list.",
      );
    } finally {
      setWorking(false);
    }
  };

  const act = async (entry, status) => {
    if (!list?._id || !entry?._id) return;

    setWorking(true);
    setError("");

    try {
      const response = await updateRecallEntry(list._id, entry._id, { status });

      setList(response?.data || list);
      setNotice(`Recall marked ${statusLabel(status).toLowerCase()}.`);
      await load();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to update recall.",
      );
    } finally {
      setWorking(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    if (!settings) return;

    setWorking(true);
    setError("");

    try {
      const response = await updateRecallSettings({
        ...settings,
        firstRecallMonths: Number(settings.firstRecallMonths || 0),
        secondRecallMonths: Number(settings.secondRecallMonths || 0),
        thirdRecallMonths: Number(settings.thirdRecallMonths || 0),
        fourthRecallMonths: Number(settings.fourthRecallMonths || 0),
        fifthRecallMonths: Number(settings.fifthRecallMonths || 0),
      });

      setSettings(response?.data || settings);
      setShowSettings(false);
      setNotice("Recall settings saved.");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to save recall settings.",
      );
    } finally {
      setWorking(false);
    }
  };

  const printList = () => {
    if (!list) return;
    window.print();
  };

  return (
    <DocumentShell
      eyebrow="Patient engagement"
      title="Recall Management"
      subtitle="Create, review and process patient recall lists with clear follow-up tracking."
      code="RECALL"
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading || working}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Settings2 size={14} />
            Settings
          </button>

          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <CalendarDays size={14} />
            Create recall list
          </button>
        </div>
      }
    >
      {error && (
        <div className="mx-5 mt-5 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
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

      {notice && (
        <div className="mx-5 mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-7">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <Section
        number="01"
        title="Recall overview"
        description="Monitor the current recall workload and the activity completed for the active list."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            icon={Users}
            label="Patients selected"
            value={stats.total}
            accent="blue"
          />
          <SummaryCard
            icon={Clock3}
            label="Pending"
            value={stats.pending}
            accent="amber"
          />
          <SummaryCard
            icon={FileText}
            label="Printed"
            value={stats.printed}
            accent="violet"
          />
          <SummaryCard
            icon={Phone}
            label="Phoned"
            value={stats.phoned}
            accent="emerald"
          />
          <SummaryCard
            icon={Clock3}
            label="Held"
            value={stats.held}
            accent="rose"
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                Recall list history
              </div>
              <div className="mt-1 text-sm font-bold text-slate-800">
                Generated lists
              </div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {summary.length} list{summary.length === 1 ? "" : "s"}
            </span>
          </div>

          <Table
            columns={[
              {
                key: "period",
                label: "Period",
                render: (row) => (
                  <span className="font-semibold text-slate-700">
                    {fmt(row.fromDate)} → {fmt(row.toDate)}
                  </span>
                ),
              },
              {
                key: "created",
                label: "Created",
                render: (row) => fmt(row.createdAt),
              },
              {
                key: "selected",
                label: "Selected",
                render: (row) => row.selected || 0,
              },
              {
                key: "printed",
                label: "Printed",
                render: (row) => row.noPrintedTotal || 0,
              },
              { key: "hold", label: "Hold", render: (row) => row.noHold || 0 },
              {
                key: "phoned",
                label: "Phoned",
                render: (row) => row.noPhoned || 0,
              },
            ]}
            rows={summary}
            empty="No recall lists created yet."
          />
        </div>
      </Section>

      {showCreate && (
        <Section
          number="02"
          title="Create recall list"
          description="Build an inclusive date-range list of patients whose recall is due. Exclusion months can be used to prevent recent contacts from being selected."
        >
          <form onSubmit={create}>
            <div className="grid gap-4 lg:grid-cols-4">
              <Field
                label="Start date"
                type="date"
                value={range.fromDate}
                onChange={(value) =>
                  setRange((current) => ({ ...current, fromDate: value }))
                }
                required
              />

              <Field
                label="End date"
                type="date"
                value={range.toDate}
                onChange={(value) =>
                  setRange((current) => ({ ...current, toDate: value }))
                }
                required
              />

              <Field
                label="Exclusion months"
                type="number"
                min="0"
                value={range.exclusionMonths}
                onChange={(value) =>
                  setRange((current) => ({
                    ...current,
                    exclusionMonths: value,
                  }))
                }
              />

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={working}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 text-xs font-bold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CalendarDays size={14} />
                  {working ? "Creating..." : "Create list"}
                </button>
              </div>
            </div>
          </form>
        </Section>
      )}

      {showSettings && settings && (
        <Section
          number="03"
          title="Recall settings"
          description="Configure the first five recall periods used by the practice."
        >
          <form onSubmit={saveSettings}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field
                label="First recall (months)"
                type="number"
                min="0"
                value={settings.firstRecallMonths}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    firstRecallMonths: Number(value),
                  })
                }
              />
              <Field
                label="Second recall"
                type="number"
                min="0"
                value={settings.secondRecallMonths}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    secondRecallMonths: Number(value),
                  })
                }
              />
              <Field
                label="Third recall"
                type="number"
                min="0"
                value={settings.thirdRecallMonths}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    thirdRecallMonths: Number(value),
                  })
                }
              />
              <Field
                label="Fourth recall"
                type="number"
                min="0"
                value={settings.fourthRecallMonths}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    fourthRecallMonths: Number(value),
                  })
                }
              />
              <Field
                label="Fifth recall"
                type="number"
                min="0"
                value={settings.fifthRecallMonths}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    fifthRecallMonths: Number(value),
                  })
                }
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <Field
                label="Default recall letter"
                value={settings.defaultLetter || ""}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    defaultLetter: value,
                  })
                }
              />

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={working}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white disabled:opacity-60"
                >
                  <CheckCircle2 size={14} />
                  {working ? "Saving..." : "Save settings"}
                </button>
              </div>
            </div>
          </form>
        </Section>
      )}

      <Section
        number={showCreate || showSettings ? "04" : "02"}
        title="Current recall list"
        description="Search the active recall list, review patients and process each recall action."
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <UserRound
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient, patient number, phone or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="printed">Printed</option>
            <option value="phoned">Phoned</option>
            <option value="held">Held</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Filter size={14} />
            Clear
          </button>

          {list && (
            <button
              type="button"
              onClick={printList}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 print:hidden"
            >
              <Printer size={14} />
              Print list
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                className="mx-auto animate-spin text-slate-300"
                size={26}
              />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Loading recall management...
              </p>
            </div>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: "patient",
                label: "Patient",
                render: (entry) => (
                  <button
                    type="button"
                    onClick={() =>
                      nav(
                        `/patients/${entry.patientId?._id || entry.patientId}`,
                      )
                    }
                    className="text-left"
                  >
                    <span className="block text-sm font-semibold text-slate-900 hover:underline">
                      {entry.patientName || "Unknown patient"}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      {entry.patientNumber || "No number"} ·{" "}
                      {entry.phone || "No phone"}
                    </span>
                  </button>
                ),
              },
              {
                key: "last",
                label: "Last visit",
                render: (entry) => fmt(entry.lastVisit),
              },
              {
                key: "next",
                label: "Next recall",
                render: (entry) => fmt(entry.nextRecall),
              },
              {
                key: "stage",
                label: "Stage",
                render: (entry) => `#${entry.recallStage || 1}`,
              },
              {
                key: "letter",
                label: "Letter",
                render: (entry) =>
                  entry.letter || settings?.defaultLetter || "Standard Recall",
              },
              {
                key: "status",
                label: "Status",
                render: (entry) => (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      entry.status === "pending"
                        ? "border-amber-100 bg-amber-50 text-amber-700"
                        : entry.status === "phoned"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : entry.status === "printed"
                            ? "border-blue-100 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {statusLabel(entry.status)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (entry) => (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        nav(
                          `/patients/${entry.patientId?._id || entry.patientId}`,
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Patient
                    </button>

                    {entry.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => act(entry, "printed")}
                          className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                        >
                          <Printer size={11} className="mr-1" />
                          Printed
                        </button>

                        <button
                          type="button"
                          disabled={working}
                          onClick={() => act(entry, "phoned")}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-50"
                        >
                          <Phone size={11} className="mr-1" />
                          Phoned
                        </button>

                        <button
                          type="button"
                          disabled={working}
                          onClick={() => act(entry, "held")}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 disabled:opacity-50"
                        >
                          Hold
                        </button>
                      </>
                    )}

                    {entry.status === "held" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => act(entry, "pending")}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-50"
                      >
                        Release
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={entries}
            empty="No patients match the current recall filters."
          />
        )}
      </Section>

      <Section
        number={showCreate || showSettings ? "05" : "03"}
        title="Recall workflow"
        description="A clear operational sequence from due recall through follow-up."
      >
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["01", "Due", "Patient reaches recall date"],
            ["02", "List", "Create inclusive date-range list"],
            ["03", "Review", "Check patient details and status"],
            ["04", "Contact", "Print, phone or hold"],
            ["05", "Next cycle", "Subsequent recall is calculated"],
          ].map(([number, title, description]) => (
            <div
              key={number}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-[10px] font-bold tracking-[.18em] text-slate-400">
                {number}
              </div>
              <div className="mt-2 text-sm font-bold text-slate-800">
                {title}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentShell>
  );
}

function SummaryCard({ icon: Icon, label, value, accent = "slate" }) {
  const accents = {
    blue: "from-blue-50 to-cyan-50 text-blue-700",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    amber: "from-amber-50 to-orange-50 text-amber-700",
    rose: "from-rose-50 to-pink-50 text-rose-700",
    slate: "from-slate-50 to-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
            accents[accent] || accents.slate
          }`}
        >
          <Icon size={17} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
          KPI
        </span>
      </div>

      <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}
