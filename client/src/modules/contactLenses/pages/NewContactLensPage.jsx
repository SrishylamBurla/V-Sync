import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import {
  createContactLens,
  getLatestContactLensConsultation,
} from "../contactLens.api";
import { getPatients } from "../../patients/patient.api";
import { getContactLensCodes } from "../../catalogue/catalogue.api";
import {
  DocumentShell,
  Section,
  Field,
  InfoGrid,
} from "../../../components/common/DocumentUI";
const eye = () => ({
  power: "",
  sphere: "",
  cylinder: "",
  axis: "",
  bc: "",
  dia: "",
  add: "",
  colour: "",
});
const name = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
export default function NewContactLensPage() {
  const { patientId: initial } = useParams();
  const nav = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(initial || "");
  const [consult, setConsult] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [form, setForm] = useState({
    patientId: initial || "",
    consultationId: "",
    orderType: "consultation_and_order",
    lensType: "Soft",
    brand: "",
    model: "",
    supplier: "",
    right: eye(),
    left: eye(),
    replacement: "Monthly",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    dueDate: "",
    notes: "",
  });
  useEffect(() => {
    getPatients({ limit: 20, search })
      .then((r) => setPatients(r?.data || []))
      .catch(() => {});
  }, [search]);
  useEffect(() => {
    getContactLensCodes()
      .then((r) => setCatalogue(r?.data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (selected)
      getLatestContactLensConsultation(selected)
        .then((r) => {
          setConsult(r?.data || null);
          if (r?.data) setForm((f) => ({ ...f, consultationId: r.data._id }));
        })
        .catch(() => {});
  }, [selected]);
  const total = Math.max(
    0,
    Number(form.quantity || 1) * Number(form.unitPrice || 0) -
      Number(form.discount || 0),
  );
  const save = async (e) => {
    e.preventDefault();
    if (!form.patientId) {
      setError("Please select a patient");
      return;
    }
    try {
      const r = await createContactLens({ ...form, total });
      nav(`/optical/contact-lenses/${r?.data?._id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to create order");
    }
  };
  const setEye = (side, key, value) =>
    setForm((f) => ({ ...f, [side]: { ...f[side], [key]: value } }));
  return (
    <DocumentShell
      eyebrow="Optical workspace"
      title="New Contact Lens Order"
      subtitle="Complete contact lens consultation and order document."
      code="NEW CONTACT LENS"
      actions={
        <button
          form="cl-form"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
        >
          <Save size={14} />
          Create order
        </button>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form id="cl-form" onSubmit={save}>
        <Section number="01" title="Patient">
          <div className="relative">
            <Field
              label="Search patient"
              value={search}
              onChange={setSearch}
              placeholder="Name, phone or patient number..."
            />
            {search && patients.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {patients.slice(0, 8).map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => {
                      setSelected(p._id);
                      setForm((f) => ({ ...f, patientId: p._id }));
                      setSearch("");
                    }}
                    className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <b>{name(p)}</b>
                    <span className="ml-3 text-xs text-slate-400">
                      {p.patientNumber} · {p.phone || "No phone"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected && (
            <div className="mt-4">
              <InfoGrid
                items={[
                  { label: "Patient ID", value: form.patientId },
                  {
                    label: "Consultation",
                    value: consult?.consultationDate
                      ? new Date(consult.consultationDate).toLocaleDateString(
                          "en-IN",
                        )
                      : "No contact-lens consultation",
                  },
                  {
                    label: "Clinician",
                    value:
                      [
                        consult?.optometristId?.firstName,
                        consult?.optometristId?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || "—",
                  },
                ]}
              />
            </div>
          )}
        </Section>
        <Section number="02" title="Order details">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Order type"
              value={form.orderType}
              onChange={(v) => setForm({ ...form, orderType: v })}
              options={[
                "consultation_and_order",
                "consultation_only",
                "order_only",
                "repeat_order",
              ]}
            />
            <Field
              label="Catalogue lens"
              value=""
              onChange={(v) => {
                const x = catalogue.find((c) => c._id === v);
                if (x)
                  setForm((f) => ({
                    ...f,
                    lensType: x.lensType,
                    brand: x.brand,
                    model: x.model,
                    supplier: x.supplierId?.name || x.supplierId || "",
                    unitPrice: Number(x.sellingPrice || 0),
                    catalogueId: x._id,
                  }));
              }}
              options={[
                { value: "", label: "Select catalogue lens" },
                ...catalogue.map((c) => ({
                  value: c._id,
                  label: `${c.code} · ${c.brand} ${c.model}`,
                })),
              ]}
            />
            <Field
              label="Lens type"
              value={form.lensType}
              onChange={(v) => setForm({ ...form, lensType: v })}
              options={[
                "Soft",
                "RGP",
                "Toric",
                "Multifocal",
                "Cosmetic",
                "Other",
              ]}
            />
            <Field
              label="Brand"
              value={form.brand}
              onChange={(v) => setForm({ ...form, brand: v })}
            />
            <Field
              label="Model"
              value={form.model}
              onChange={(v) => setForm({ ...form, model: v })}
            />
            <Field
              label="Supplier"
              value={form.supplier}
              onChange={(v) => setForm({ ...form, supplier: v })}
            />
            <Field
              label="Replacement"
              value={form.replacement}
              onChange={(v) => setForm({ ...form, replacement: v })}
              options={[
                "Daily",
                "Fortnightly",
                "Monthly",
                "3 Monthly",
                "6 Monthly",
                "Yearly",
                "Other",
              ]}
            />
            <Field
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(v) => setForm({ ...form, quantity: Number(v) })}
            />
            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(v) => setForm({ ...form, dueDate: v })}
            />
          </div>
        </Section>
        <Section number="03" title="Right eye">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "power",
              "sphere",
              "cylinder",
              "axis",
              "bc",
              "dia",
              "add",
              "colour",
            ].map((k) => (
              <Field
                key={k}
                label={k.toUpperCase()}
                value={form.right[k]}
                onChange={(v) => setEye("right", k, v)}
              />
            ))}
          </div>
        </Section>
        <Section number="04" title="Left eye">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "power",
              "sphere",
              "cylinder",
              "axis",
              "bc",
              "dia",
              "add",
              "colour",
            ].map((k) => (
              <Field
                key={k}
                label={k.toUpperCase()}
                value={form.left[k]}
                onChange={(v) => setEye("left", k, v)}
              />
            ))}
          </div>
        </Section>
        <Section number="05" title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Unit price"
              type="number"
              value={form.unitPrice}
              onChange={(v) => setForm({ ...form, unitPrice: Number(v) })}
            />
            <Field
              label="Discount"
              type="number"
              value={form.discount}
              onChange={(v) => setForm({ ...form, discount: Number(v) })}
            />
            <Field label="Total" value={`₹${total.toFixed(2)}`} disabled />
          </div>
        </Section>
        <Section number="06" title="Notes">
          <Field
            label="Order notes"
            type="textarea"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />
        </Section>
      </form>
    </DocumentShell>
  );
}
