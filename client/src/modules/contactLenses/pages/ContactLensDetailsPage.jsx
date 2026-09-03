import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { getContactLens, updateContactLens } from "../contactLens.api";
import {
  DocumentShell,
  Section,
  InfoGrid,
} from "../../../components/common/DocumentUI";
const name = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
const statuses = [
  "draft",
  "ordered",
  "ready",
  "notified",
  "collected",
  "cancelled",
];
export default function ContactLensDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const load = () =>
    getContactLens(id)
      .then((r) => setItem(r.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load order"),
      );
  useEffect(load, [id]);
  const change = async (status) => {
    try {
      const r = await updateContactLens(id, { status });
      setItem(r.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update order");
    }
  };
  if (!item)
    return (
      <DocumentShell
        eyebrow="Optical"
        title="Contact Lens Order"
        code="CONTACT LENS"
      >
        <div className="p-8 text-sm text-slate-500">
          {error || "Loading..."}
        </div>
      </DocumentShell>
    );
  return (
    <DocumentShell
      eyebrow="Optical workspace"
      title="Contact Lens Order"
      subtitle={`${name(item.patientId)} · ${item.orderNumber}`}
      code={item.orderNumber}
      status={item.status}
      actions={
        <>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold print:hidden"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={() => nav(`/patients/${item.patientId?._id}`)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white print:hidden"
          >
            Patient record
          </button>
        </>
      }
    >
      <Section number="01" title="Patient & order">
        <InfoGrid
          items={[
            { label: "Patient", value: name(item.patientId) },
            { label: "Patient number", value: item.patientId?.patientNumber },
            { label: "Phone", value: item.patientId?.phone },
            {
              label: "Order type",
              value: item.orderType?.replaceAll("_", " "),
            },
            {
              label: "Order date",
              value: item.orderDate
                ? new Date(item.orderDate).toLocaleDateString("en-IN")
                : "—",
            },
            {
              label: "Due date",
              value: item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("en-IN")
                : "—",
            },
            {
              label: "Lens",
              value: `${item.brand || "—"} ${item.model || ""}`,
            },
            { label: "Replacement", value: item.replacement },
          ]}
        />
      </Section>
      <Section number="02" title="Prescription">
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            ["RIGHT EYE", item.right],
            ["LEFT EYE", item.left],
          ].map(([label, e]) => (
            <div key={label} className="rounded-xl border border-slate-200 p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Object.entries(e || {}).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase text-slate-400">
                      {k}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section number="03" title="Pricing">
        <InfoGrid
          items={[
            { label: "Quantity", value: item.quantity },
            {
              label: "Unit price",
              value: `₹${Number(item.unitPrice || 0).toFixed(2)}`,
            },
            {
              label: "Discount",
              value: `₹${Number(item.discount || 0).toFixed(2)}`,
            },
            { label: "Total", value: `₹${Number(item.total || 0).toFixed(2)}` },
          ]}
        />
      </Section>
      <Section number="04" title="Workflow">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s, i) => (
            <button
              key={s}
              disabled={s === "cancelled" ? false : false}
              onClick={() => change(s)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${item.status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Current status: {item.status}. Status changes are saved immediately.
        </p>
      </Section>
      <Section number="05" title="Notes">
        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {item.notes || "No notes recorded."}
        </div>
      </Section>
    </DocumentShell>
  );
}
