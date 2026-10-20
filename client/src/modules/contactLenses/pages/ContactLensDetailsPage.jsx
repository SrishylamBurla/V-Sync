// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Printer } from "lucide-react";
// import { getContactLens, updateContactLens } from "../contactLens.api";
// import {
//   DocumentShell,
//   Section,
//   InfoGrid,
// } from "../../../components/common/DocumentUI";
// const name = (p) =>
//   [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
// const statuses = [
//   "draft",
//   "ordered",
//   "ready",
//   "notified",
//   "collected",
//   "cancelled",
// ];
// export default function ContactLensDetailsPage() {
//   const { id } = useParams();
//   const nav = useNavigate();
//   const [item, setItem] = useState(null);
//   const [error, setError] = useState("");
//   const load = () =>
//     getContactLens(id)
//       .then((r) => setItem(r.data))
//       .catch((e) =>
//         setError(e?.response?.data?.message || "Unable to load order"),
//       );
//   useEffect(() => {
//     void load();
//   }, [id]);
//   const change = async (status) => {
//     try {
//       const r = await updateContactLens(id, { status });
//       setItem(r.data);
//     } catch (e) {
//       setError(e?.response?.data?.message || "Unable to update order");
//     }
//   };
//   if (!item)
//     return (
//       <DocumentShell
//         eyebrow="Optical"
//         title="Contact Lens Order"
//         code="CONTACT LENS"
//       >
//         <div className="p-8 text-sm text-slate-500">
//           {error || "Loading..."}
//         </div>
//       </DocumentShell>
//     );
//   return (
//     <DocumentShell
//       eyebrow="Optical workspace"
//       title="Contact Lens Order"
//       subtitle={`${name(item.patientId)} · ${item.orderNumber}`}
//       code={item.orderNumber}
//       status={item.status}
//       actions={
//         <>
//           <button
//             onClick={() => window.print()}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold print:hidden"
//           >
//             <Printer size={14} />
//             Print
//           </button>
//           <button
//             onClick={() => nav(`/patients/${item.patientId?._id}`)}
//             className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white print:hidden"
//           >
//             Patient record
//           </button>
//         </>
//       }
//     >
//       <Section number="01" title="Patient & order">
//         <InfoGrid
//           items={[
//             { label: "Patient", value: name(item.patientId) },
//             { label: "Patient number", value: item.patientId?.patientNumber },
//             { label: "Phone", value: item.patientId?.phone },
//             {
//               label: "Order type",
//               value: item.orderType?.replaceAll("_", " "),
//             },
//             {
//               label: "Order date",
//               value: item.orderDate
//                 ? new Date(item.orderDate).toLocaleDateString("en-IN")
//                 : "—",
//             },
//             {
//               label: "Due date",
//               value: item.dueDate
//                 ? new Date(item.dueDate).toLocaleDateString("en-IN")
//                 : "—",
//             },
//             {
//               label: "Lens",
//               value: `${item.brand || "—"} ${item.model || ""}`,
//             },
//             { label: "Replacement", value: item.replacement },
//           ]}
//         />
//       </Section>
//       <Section number="02" title="Prescription">
//         <div className="grid gap-5 lg:grid-cols-2">
//           {[
//             ["RIGHT EYE", item.right],
//             ["LEFT EYE", item.left],
//           ].map(([label, e]) => (
//             <div key={label} className="rounded-xl border border-slate-200 p-5">
//               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
//                 {label}
//               </h4>
//               <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
//                 {Object.entries(e || {}).map(([k, v]) => (
//                   <div key={k}>
//                     <div className="text-[10px] uppercase text-slate-400">
//                       {k}
//                     </div>
//                     <div className="mt-1 text-sm font-semibold">{v || "—"}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </Section>
//       <Section number="03" title="Pricing">
//         <InfoGrid
//           items={[
//             { label: "Quantity", value: item.quantity },
//             {
//               label: "Unit price",
//               value: `₹${Number(item.unitPrice || 0).toFixed(2)}`,
//             },
//             {
//               label: "Discount",
//               value: `₹${Number(item.discount || 0).toFixed(2)}`,
//             },
//             { label: "Total", value: `₹${Number(item.total || 0).toFixed(2)}` },
//           ]}
//         />
//       </Section>
//       <Section number="04" title="Workflow">
//         <div className="flex flex-wrap gap-2">
//           {statuses.map((s, i) => (
//             <button
//               key={s}
//               disabled={s === "cancelled" ? false : false}
//               onClick={() => change(s)}
//               className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${item.status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
//             >
//               {s.replace("_", " ")}
//             </button>
//           ))}
//         </div>
//         <p className="mt-4 text-xs text-slate-400">
//           Current status: {item.status}. Status changes are saved immediately.
//         </p>
//       </Section>
//       <Section number="05" title="Notes">
//         <div className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
//           {item.notes || "No notes recorded."}
//         </div>
//       </Section>
//     </DocumentShell>
//   );
// }
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
      .then((r) => setItem(r.data || r))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load order")
      );

  useEffect(() => {
    void load();
  }, [id]);

  const change = async (status) => {
    try {
      const r = await updateContactLens(id, { status });
      setItem(r.data || r);
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

  const category = item.lensCategory || item.lensType || "soft";

  return (
    <DocumentShell
      eyebrow="Optical workspace"
      title="Contact Lens Order"
      subtitle={`${name(item.patientId)} · ${item.orderNumber || id}`}
      code={item.orderNumber || id}
      status={item.status}
      actions={
        <>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold print:hidden hover:bg-slate-50"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={() => nav(`/patients/${item.patientId?._id || item.patientId}`)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white print:hidden hover:bg-slate-800"
          >
            Patient record
          </button>
        </>
      }
    >
      {/* SECTION 01: PATIENT & ORDER DETAILS */}
      <Section number="01" title="Patient & order">
        <InfoGrid
          items={[
            { label: "Patient", value: name(item.patientId) },
            { label: "Patient number", value: item.patientId?.patientNumber },
            { label: "Phone", value: item.patientId?.phone },
            {
              label: "Modality",
              value: category.toUpperCase(),
            },
            {
              label: "Order date",
              value: item.orderDate
                ? new Date(item.orderDate).toLocaleDateString("en-IN")
                : item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-IN")
                : "—",
            },
            {
              label: "Due date",
              value: item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("en-IN")
                : "—",
            },
            {
              label: "Brand / Model",
              value: `${item.brand || "—"} ${item.model || ""}`,
            },
            { label: "Replacement", value: item.replacement || "—" },
          ]}
        />
      </Section>

      {/* SECTION 02: PRESCRIPTION SPECIFICATIONS */}
      <Section number="02" title="Prescription & Corneal Parameters">
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            ["RIGHT EYE (OD)", item.right],
            ["LEFT EYE (OS)", item.left],
          ].map(([label, e]) => (
            <div key={label} className="rounded-xl border border-slate-200 p-5 bg-white">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">SPH</div>
                  <div className="mt-1 text-sm font-semibold">{e?.sph || e?.sphere || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">CYL</div>
                  <div className="mt-1 text-sm font-semibold">{e?.cyl || e?.cylinder || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">AXIS</div>
                  <div className="mt-1 text-sm font-semibold">{e?.axis || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">VA</div>
                  <div className="mt-1 text-sm font-semibold">{e?.va || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">ADD</div>
                  <div className="mt-1 text-sm font-semibold">{e?.add || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">BC</div>
                  <div className="mt-1 text-sm font-semibold">{e?.bc || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">DIA</div>
                  <div className="mt-1 text-sm font-semibold">{e?.dia || "—"}</div>
                </div>
                {(e?.flatK || e?.steepK) && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">K-Values</div>
                    <div className="mt-1 text-sm font-semibold">
                      {e?.flatK || "—"} / {e?.steepK || "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 03: CLINICAL FITTING EVALUATION (SOFT / RGP / SCLERAL) */}
      {(item.scleralFit || item.rgpFit || item.softFit || category !== "soft") && (
        <Section number="03" title={`${category.toUpperCase()} Fitting Evaluation`}>
          <div className="grid gap-5 lg:grid-cols-2">
            {/* RIGHT EYE FIT */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Right Eye (OD) Fit Details
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {category === "scleral" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Sagittal Depth</div>
                      <div className="mt-1 text-sm font-semibold">{item.right?.sagittalDepth || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Initial Vault</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.initialVaultOD || item.right?.vaultInitial || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Settled Vault</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.settledVaultOD || item.right?.vaultSettled || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Landing Zone</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.landingZoneOD || item.right?.landingZone || "Alignment"}</div>
                    </div>
                  </>
                )}

                {category === "rgp" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Apical Pattern</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.apicalOD || "Parallel / Alignment"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Edge Lift</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.edgeLiftOD || "0.4mm"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Dynamic Fit</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.dynamicOD || "Centered"}</div>
                    </div>
                  </>
                )}

                {category === "soft" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Centration</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.centrationOD || "Centered"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Movement</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.movementOD || "0.3mm"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Push-Up Test</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.pushUpOD || "50%"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* LEFT EYE FIT */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Left Eye (OS) Fit Details
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {category === "scleral" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Sagittal Depth</div>
                      <div className="mt-1 text-sm font-semibold">{item.left?.sagittalDepth || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Initial Vault</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.initialVaultOS || item.left?.vaultInitial || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Settled Vault</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.settledVaultOS || item.left?.vaultSettled || "—"} μm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Landing Zone</div>
                      <div className="mt-1 text-sm font-semibold">{item.scleralFit?.landingZoneOS || item.left?.landingZone || "Alignment"}</div>
                    </div>
                  </>
                )}

                {category === "rgp" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Apical Pattern</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.apicalOS || "Parallel / Alignment"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Edge Lift</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.edgeLiftOS || "0.4mm"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Dynamic Fit</div>
                      <div className="mt-1 text-sm font-semibold">{item.rgpFit?.dynamicOS || "Centered"}</div>
                    </div>
                  </>
                )}

                {category === "soft" && (
                  <>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Centration</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.centrationOS || "Centered"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Movement</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.movementOS || "0.3mm"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Push-Up Test</div>
                      <div className="mt-1 text-sm font-semibold">{item.softFit?.pushUpOS || "50%"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* SECTION 04: PRICING */}
      <Section number="04" title="Pricing">
        <InfoGrid
          items={[
            { label: "Quantity", value: item.quantity || 2 },
            {
              label: "Unit price",
              value: `₹${Number(item.unitPrice || item.price || 0).toFixed(2)}`,
            },
            {
              label: "Discount",
              value: `₹${Number(item.discount || 0).toFixed(2)}`,
            },
            {
              label: "Total",
              value: `₹${Number(item.total || item.totalPrice || 0).toFixed(2)}`,
            },
          ]}
        />
      </Section>

      {/* SECTION 05: WORKFLOW STATUS */}
      <Section number="05" title="Workflow">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => change(s)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                item.status === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Current status: <strong className="capitalize text-slate-700">{item.status?.replace("_", " ")}</strong>. Status changes are saved immediately.
        </p>
      </Section>

      {/* SECTION 06: NOTES */}
      <Section number="06" title="Notes & Instructions">
        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {item.notes || "No special instructions or clinical notes recorded."}
        </div>
      </Section>
    </DocumentShell>
  );
}