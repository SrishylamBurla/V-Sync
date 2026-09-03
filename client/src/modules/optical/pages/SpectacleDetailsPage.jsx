import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Printer } from "lucide-react";
import { getSpectacle, updateSpectacle } from "../spectacle.api";
import {
  DocumentShell,
  Section,
  InfoGrid,
} from "../../../components/common/DocumentUI";
const actions = {
  draft: ["ordered", "cancelled"],
  ordered: ["not_ready", "cancelled"],
  not_ready: ["ready", "cancelled"],
  ready: ["notified", "collected"],
  notified: ["collected"],
  collected: [],
  cancelled: [],
};
const money = (v) => Number(v || 0).toFixed(2);
const fmt = (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");
export default function SpectacleDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const r = await getSpectacle(id);
      setJob(r?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load spectacle");
    }
  };
  useEffect(() => {
    load();
  }, [id]);
  const change = async (status) => {
    try {
      const r = await updateSpectacle(id, { status });
      setJob(r?.data || job);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update");
    }
  };
  if (!job)
    return (
      <div className="py-10 text-sm text-slate-500">
        {error || "Loading spectacle record..."}
      </div>
    );
  const p = job.patientId;
  return (
    <DocumentShell
      eyebrow="Optical"
      title="Spectacle Record"
      subtitle="Complete spectacle job document."
      code={job.jobNumber}
      status={job.status}
      actions={
        <>
          <button
            onClick={() => nav("/optical")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <Printer size={14} />
            Print
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Section number="01" title="Patient & Job">
        <InfoGrid
          items={[
            {
              label: "Patient",
              value: [p?.firstName, p?.middleName, p?.lastName]
                .filter(Boolean)
                .join(" "),
            },
            { label: "Patient No.", value: p?.patientNumber },
            { label: "Job Date", value: fmt(job.jobDate) },
            { label: "Due Date", value: fmt(job.dueDate) },
            { label: "Phone", value: p?.phone },
          ]}
        />
      </Section>
      <Section number="02" title="Prescription">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400">
                <th className="py-2 text-left">Eye</th>
                {[
                  "Sphere",
                  "Cylinder",
                  "Axis",
                  "VA",
                  "Add",
                  "Inter",
                  "Prism",
                  "Base",
                ].map((x) => (
                  <th key={x} className="py-2 text-left">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["right", "left"].map((e) => (
                <tr key={e} className="border-b border-slate-100">
                  <td className="py-3 font-semibold">
                    {e === "right" ? "OD · Right" : "OS · Left"}
                  </td>
                  {[
                    "sphere",
                    "cylinder",
                    "axis",
                    "va",
                    "add",
                    "inter",
                    "prism",
                    "base",
                  ].map((k) => (
                    <td key={k} className="py-3">
                      {job.rx?.[e]?.[k] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <InfoGrid
            items={[
              { label: "Right PD", value: job.pd?.right },
              { label: "Left PD", value: job.pd?.left },
              { label: "Total PD", value: job.pd?.total },
              { label: "Rx Comment", value: job.rx?.note },
            ]}
          />
        </div>
      </Section>
      <Section number="03" title="Frame & Lens">
        <InfoGrid
          items={[
            { label: "Frame Code", value: job.frame?.code },
            { label: "Frame", value: job.frame?.description },
            {
              label: "Frame Price",
              value: `₹${money(job.framePrice ?? job.frame?.price)}`,
            },
            { label: "Lens Code", value: job.lens?.code },
            { label: "Lens", value: job.lens?.description },
            { label: "Supplier", value: job.lens?.supplier },
            {
              label: "Lens Price",
              value: `₹${money(job.lensPrice ?? job.lens?.price)}`,
            },
            { label: "Lens Ordered", value: fmt(job.lensOrderDate) },
          ]}
        />
      </Section>
      <Section number="04" title="Extras">
        <div className="space-y-2">
          {job.extras?.length ? (
            job.extras.map((x, i) => (
              <div
                key={i}
                className="flex justify-between rounded-xl border border-slate-200 p-3 text-sm"
              >
                <span>{x.description || "Extra"}</span>
                <span>₹{money(x.price)}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">No extras.</div>
          )}
        </div>
      </Section>
      <Section number="05" title="Financial">
        <div className="ml-auto max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span>Frame</span>
            <b>₹{money(job.framePrice)}</b>
          </div>
          <div className="flex justify-between">
            <span>Lens</span>
            <b>₹{money(job.lensPrice)}</b>
          </div>
          <div className="flex justify-between">
            <span>Extras</span>
            <b>₹{money(job.extrasTotal)}</b>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <b>₹{money(job.discount)}</b>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
            <b>Total</b>
            <b>₹{money(job.total)}</b>
          </div>
        </div>
      </Section>
      <Section number="06" title="Dispensing">
        <InfoGrid
          items={[
            { label: "Ready", value: fmt(job.jobReadyAt) },
            { label: "Last Notified", value: fmt(job.lastNotifiedAt) },
            { label: "Collected", value: fmt(job.collectedAt) },
            { label: "Billing No.", value: job.billingNo },
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-2 print:hidden">
          {(actions[job.status] || []).map((s) => (
            <button
              key={s}
              onClick={() => change(s)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
            >
              <Check size={14} />
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </Section>
      <Section number="07" title="Notes">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {job.notes || "No notes recorded."}
        </p>
      </Section>
    </DocumentShell>
  );
}
