import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  DocumentShell,
  Field,
  RepeatableRows,
  Section,
  Table,
} from "../../../components/common/DocumentUI";

const catalog = {
  clinical: {
    eyebrow: "Clinical workspace",
    title: "Clinical Management",
    code: "CLINICAL",
    sections: [
      "Clinical Queue",
      "Examination Record",
      "Clinical Notes",
      "Follow-up",
    ],
    roles: "Clinical",
  },
  optical: {
    eyebrow: "Optical workspace",
    title: "Optical Management",
    code: "OPTICAL",
    sections: [
      "Spectacle Jobs",
      "Contact Lens Orders",
      "Optical Sales",
      "Job Notes",
    ],
    roles: "Optical",
  },
  inventory: {
    eyebrow: "Inventory workspace",
    title: "Inventory Management",
    code: "INVENTORY",
    sections: ["Frames", "Lenses", "Sundries", "Stock Control"],
    roles: "Inventory",
  },
  lab: {
    eyebrow: "Laboratory workspace",
    title: "Laboratory Management",
    code: "LAB",
    sections: [
      "Pending Jobs",
      "Production Queue",
      "Quality Control",
      "Dispatch",
    ],
    roles: "Laboratory",
  },
  billing: {
    eyebrow: "Finance workspace",
    title: "Billing & Payments",
    code: "FINANCE",
    sections: [
      "Invoices",
      "Payments",
      "Outstanding Accounts",
      "Financial Notes",
    ],
    roles: "Finance",
  },
  recall: {
    eyebrow: "Patient engagement",
    title: "Recall Management",
    code: "RECALL",
    sections: ["Recall Due", "Contact Queue", "Campaigns", "Recall History"],
    roles: "Patient engagement",
  },
  reports: {
    eyebrow: "Management",
    title: "Reports & Statistics",
    code: "REPORTS",
    sections: [
      "Practice Summary",
      "Clinical Statistics",
      "Sales Statistics",
      "Inventory Statistics",
    ],
    roles: "Management",
  },
  staff: {
    eyebrow: "Administration",
    title: "Staff Management",
    code: "STAFF",
    sections: [
      "Staff Register",
      "Roles & Permissions",
      "Activity",
      "Account Notes",
    ],
    roles: "Administration",
  },
  settings: {
    eyebrow: "Administration",
    title: "Practice Settings",
    code: "SETTINGS",
    sections: [
      "Practice Profile",
      "Clinical Setup",
      "Optical Setup",
      "Notifications",
    ],
    roles: "Administration",
  },
  communications: {
    eyebrow: "Patient records",
    title: "Letters & Clinical Images",
    code: "COMMUNICATIONS",
    sections: [
      "Patient Documents",
      "Clinical Images",
      "Letters",
      "Document History",
    ],
    roles: "Patient records",
  },
  newsletters: {
    eyebrow: "Patient engagement",
    title: "Newsletters",
    code: "NEWSLETTERS",
    sections: ["Campaigns", "Recipients", "Content", "Delivery History"],
    roles: "Patient engagement",
  },
};

const seed = {
  clinical: [
    "Morning clinical queue",
    "Routine eye examination",
    "Follow-up review",
  ],
  optical: [
    "SP-000101 · John Smith",
    "SP-000102 · Priya Rao",
    "CL-000021 · Arjun Kumar",
  ],
  inventory: [
    "FR-1001 · Acetate frame",
    "FR-1002 · Metal frame",
    "LN-2001 · Progressive lens",
  ],
  lab: [
    "SP-000098 · Surfacing",
    "SP-000099 · Edging",
    "SP-000100 · Quality check",
  ],
  billing: [
    "INV-000301 · John Smith",
    "INV-000302 · Priya Rao",
    "INV-000303 · Arjun Kumar",
  ],
  recall: [
    "John Smith · Due today",
    "Priya Rao · Due today",
    "Arjun Kumar · Due tomorrow",
  ],
  reports: ["Daily practice summary", "Monthly revenue", "Stock valuation"],
  staff: [
    "Ravi Kumar · Optometrist",
    "Anita Rao · Receptionist",
    "Kiran Das · Cashier",
  ],
  settings: [
    "Practice identity",
    "Prescription defaults",
    "Notification preferences",
  ],
};

const statusOptions = ["Active", "Draft", "Pending", "Completed", "Cancelled"];

const createInitialForm = () => ({
  reference: "",
  date: new Date().toISOString().slice(0, 10),
  status: "Active",
  assigned: "",
  notes: "",
});

const createInitialRows = () => [{ description: "", supplier: "", amount: "" }];

const toItems = (values) =>
  values.map((record, index) => ({
    id: `${index}-${record}`,
    record,
    status: "Active",
    date: new Date().toISOString().slice(0, 10),
  }));

export default function ModuleDocumentPage({ type }) {
  const config = catalog[type] || catalog.clinical;

  const [items, setItems] = useState(() => toItems(seed[type] || []));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(createInitialForm);
  const [rows, setRows] = useState(createInitialRows);
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.record.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.date.includes(q);

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const activeCount = items.filter((item) => item.status === "Active").length;
  const pendingCount = items.filter((item) => item.status === "Pending").length;
  const completedCount = items.filter(
    (item) => item.status === "Completed",
  ).length;

  const flash = (message) => {
    setNotice(message);
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => setNotice(""), 2500);
  };

  const resetEditor = () => {
    setSelectedId(null);
    setEditing(false);
    setForm(createInitialForm());
    setRows(createInitialRows());
  };

  const startNew = () => {
    resetEditor();
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRecord = (item) => {
    setSelectedId(item.id);
    setEditing(false);
    setForm({
      reference: item.record,
      date: item.date,
      status: item.status,
      assigned: "",
      notes: "",
    });
    setRows(createInitialRows());
  };

  const startEdit = () => {
    if (!selectedItem) return;
    setEditing(true);
  };

  const saveRecord = async (event) => {
    event?.preventDefault();
    setSaving(true);

    try {
      const reference =
        form.reference.trim() || `${config.title} · ${form.date}`;

      if (selectedItem) {
        setItems((current) =>
          current.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  record: reference,
                  status: form.status,
                  date: form.date,
                }
              : item,
          ),
        );
        flash("Record updated successfully.");
      } else {
        const item = {
          id: `${Date.now()}-${reference}`,
          record: reference,
          status: form.status,
          date: form.date,
        };
        setItems((current) => [item, ...current]);
        setSelectedId(item.id);
        flash("Record created successfully.");
      }

      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = () => {
    if (!selectedItem) return;

    const confirmed = window.confirm(
      `Delete "${selectedItem.record}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setItems((current) =>
      current.filter((item) => item.id !== selectedItem.id),
    );
    resetEditor();
    flash("Record deleted.");
  };

  const refresh = () => {
    setQuery("");
    setStatusFilter("");
    flash("View refreshed.");
  };

  const exportCsv = () => {
    const header = ["Record", "Status", "Updated"];
    const lines = [
      header,
      ...filtered.map((item) => [item.record, item.status, item.date]),
    ];

    const csv = lines
      .map((line) =>
        line
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${config.code.toLowerCase()}-records.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    flash("CSV exported.");
  };

  return (
    <DocumentShell
      eyebrow={config.eyebrow}
      title={config.title}
      subtitle={`Complete ${config.roles.toLowerCase()} workspace in one operational document.`}
      code={config.code}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={14} />
            New record
          </button>
        </div>
      }
    >
      {notice && (
        <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 sm:mx-7">
          <CheckCircle2 size={15} />
          {notice}
        </div>
      )}

      <section className="grid gap-3 px-5 pt-5 sm:px-7 sm:grid-cols-3">
        <SummaryCard label="Total records" value={items.length} />
        <SummaryCard label="Active" value={activeCount} />
        <SummaryCard
          label="Pending / Completed"
          value={`${pendingCount} / ${completedCount}`}
        />
      </section>

      <Section
        number="01"
        title={config.sections[0] || "Operational register"}
        description="Search, review and maintain the operational register."
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}...`}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={startNew}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Plus size={14} />
            Add record
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <Table
            columns={[
              {
                key: "record",
                label: "Record",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openRecord(row)}
                    className="text-left font-semibold text-slate-800 hover:text-blue-700 hover:underline"
                  >
                    {row.record}
                  </button>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <span className={statusPill(row.status)}>{row.status}</span>
                ),
              },
              {
                key: "date",
                label: "Updated",
                render: (row) => row.date,
              },
              {
                key: "action",
                label: "Action",
                align: "right",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openRecord(row)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Open
                  </button>
                ),
              },
            ]}
            rows={filtered}
          />
        </div>
      </Section>

      <Section
        number="02"
        title={
          selectedItem ? "Record details" : config.sections[1] || "Details"
        }
        description="Review or maintain the selected record."
      >
        {editing || selectedItem ? (
          <form onSubmit={saveRecord} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Reference"
                value={form.reference}
                onChange={(value) => setForm({ ...form, reference: value })}
                placeholder="Record reference"
                required
              />
              <Field
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) => setForm({ ...form, date: value })}
              />
              <Field
                label="Status"
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={statusOptions}
              />
              <Field
                label="Assigned to"
                value={form.assigned}
                onChange={(value) => setForm({ ...form, assigned: value })}
                placeholder="Staff member"
              />
            </div>

            <Field
              label="Detailed notes"
              type="textarea"
              value={form.notes}
              onChange={(value) => setForm({ ...form, notes: value })}
              placeholder="Enter complete record notes..."
            />

            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                {selectedItem && (
                  <button
                    type="button"
                    onClick={deleteRecord}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetEditor}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X size={14} />
                  Close
                </button>

                {!editing && selectedItem && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                )}

                {editing && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : "Save record"}
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="text-sm font-semibold text-slate-700">
              No record selected
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Open a record from the register or create a new record.
            </p>
          </div>
        )}
      </Section>

      <Section
        number="03"
        title={config.sections[2] || "Line items"}
        description="Capture related line items for this document."
      >
        <RepeatableRows
          rows={rows}
          setRows={setRows}
          fields={[
            { key: "description", label: "Description" },
            { key: "supplier", label: "Supplier" },
            { key: "amount", label: "Amount" },
          ]}
        />
      </Section>

      <Section
        number="04"
        title={config.sections[3] || "History & Audit"}
        description="Operational metadata for this record."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <AuditCard
            label="Created"
            value={selectedItem ? selectedItem.date : "New record"}
          />
          <AuditCard
            label="Last updated"
            value={selectedItem ? selectedItem.date : "Not saved"}
          />
          <AuditCard
            label="Audit"
            value={selectedItem ? "Changes tracked" : "Ready for creation"}
          />
        </div>
      </Section>

      <div className="flex justify-end border-t border-slate-200 p-5 sm:p-7 print:hidden">
        <button
          type="button"
          onClick={editing ? saveRecord : startNew}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Save size={14} />
          {editing ? "Save document" : "New document"}
        </button>
      </div>
    </DocumentShell>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function AuditCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function statusPill(status) {
  const classes = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Draft: "bg-slate-100 text-slate-600 border-slate-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Completed: "bg-blue-50 text-blue-700 border-blue-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  return `inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
    classes[status] || classes.Active
  }`;
}
