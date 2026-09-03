import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Truck,
  GlassWater,
  WandSparkles,
} from "lucide-react";
import {
  DocumentShell,
  Section,
  Field,
  Table,
} from "../../../components/common/DocumentUI";
import * as api from "../catalogue.api"

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
const empty = {
  supplier: {
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    accountNumber: "",
    notes: "",
    status: "active",
  },
  lens: {
    code: "",
    description: "",
    lensType: "single_vision",
    material: "",
    index: "",
    supplierId: "",
    costPrice: 0,
    sellingPrice: 0,
    status: "active",
    notes: "",
  },
  extra: {
    code: "",
    type: "coating",
    description: "",
    supplierId: "",
    costPrice: 0,
    sellingPrice: 0,
    status: "active",
    notes: "",
  },
};
export default function CataloguePage() {
  const [tab, setTab] = useState("suppliers"),
    [suppliers, setSuppliers] = useState([]),
    [lenses, setLenses] = useState([]),
    [extras, setExtras] = useState([]),
    [query, setQuery] = useState(""),
    [show, setShow] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(empty.supplier),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setError("");
      const [s, l, e] = await Promise.all([
        api.getSuppliers(),
        api.getLensCodes(),
        api.getLensExtras(),
      ]);
      setSuppliers(s.data || []);
      setLenses(l.data || []);
      setExtras(e.data || []);
    } catch (x) {
      setError(x?.response?.data?.message || "Unable to load catalogue");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const current =
    tab === "suppliers" ? suppliers : tab === "lens" ? lenses : extras;
  const filtered = useMemo(
    () =>
      current.filter((x) =>
        JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
      ),
    [current, query],
  );
  const start = () => {
    setEditing(null);
    setForm(
      tab === "suppliers"
        ? { ...empty.supplier }
        : tab === "lens"
          ? { ...empty.lens }
          : { ...empty.extra },
    );
    setShow(true);
  };
  const edit = (x) => {
    setEditing(x._id);
    setForm({ ...x, supplierId: x.supplierId?._id || x.supplierId || "" });
    setShow(true);
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      const fn =
        tab === "suppliers"
          ? editing
            ? api.updateSupplier
            : api.createSupplier
          : tab === "lens"
            ? editing
              ? api.updateLensCode
              : api.createLensCode
            : editing
              ? api.updateLensExtra
              : api.createLensExtra;
      await (editing ? fn(editing, form) : fn(form));
      setShow(false);
      await load();
    } catch (x) {
      setError(x?.response?.data?.message || "Unable to save catalogue record");
    }
  };
  const title =
    tab === "suppliers"
      ? "Suppliers"
      : tab === "lens"
        ? "Spectacle Lens Codes"
        : "Lens Extras";
  return (
    <DocumentShell
      eyebrow="Catalogue control"
      title="Optical Catalogue"
      subtitle="Suppliers, spectacle lens codes and lens extras configured in one practice document."
      code="CATALOGUE"
      actions={
        <>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            New{" "}
            {tab === "suppliers"
              ? "supplier"
              : tab === "lens"
                ? "lens code"
                : "extra"}
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Section number="01" title="Catalogue areas">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["suppliers", "Suppliers", Truck, "Supplier master records"],
            [
              "lens",
              "Lens codes",
              GlassWater,
              "Spectacle lens pricing and parameters",
            ],
            [
              "extras",
              "Lens extras",
              WandSparkles,
              "Tinting, coating and hardening",
            ],
          ].map(([k, t, I, d]) => (
            <button
              key={k}
              onClick={() => {
                setTab(k);
                setShow(false);
                setQuery("");
              }}
              className={`rounded-2xl border p-5 text-left ${tab === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}
            >
              <I size={18} />
              <div className="mt-3 text-sm font-bold">{t}</div>
              <div
                className={`mt-1 text-xs ${tab === k ? "text-slate-300" : "text-slate-400"}`}
              >
                {d}
              </div>
            </button>
          ))}
        </div>
      </Section>
      {show && (
        <Section
          number="02"
          title={`${editing ? "Edit" : "Create"} ${title.slice(0, -1)}`}
        >
          <form
            onSubmit={save}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {tab === "suppliers" ? (
              <>
                <Field
                  label="Supplier code"
                  value={form.code}
                  onChange={(v) => setForm({ ...form, code: v })}
                />
                <Field
                  label="Supplier name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  label="Contact person"
                  value={form.contactPerson}
                  onChange={(v) => setForm({ ...form, contactPerson: v })}
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
                <Field
                  label="Account number"
                  value={form.accountNumber}
                  onChange={(v) => setForm({ ...form, accountNumber: v })}
                />
                <Field
                  className="md:col-span-2"
                  label="Address"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                />
              </>
            ) : tab === "lens" ? (
              <>
                <Field
                  label="Lens code"
                  value={form.code}
                  onChange={(v) => setForm({ ...form, code: v })}
                />
                <Field
                  label="Description"
                  value={form.description}
                  onChange={(v) => setForm({ ...form, description: v })}
                />
                <Field
                  label="Lens type"
                  value={form.lensType}
                  onChange={(v) => setForm({ ...form, lensType: v })}
                  options={[
                    "single_vision",
                    "bifocal",
                    "progressive",
                    "occupational",
                    "myopia_control",
                    "other",
                  ].map((x) => ({ value: x, label: x.replaceAll("_", " ") }))}
                />
                <Field
                  label="Supplier"
                  value={form.supplierId}
                  onChange={(v) => setForm({ ...form, supplierId: v })}
                  options={[
                    { value: "", label: "Select supplier" },
                    ...suppliers.map((s) => ({
                      value: s._id,
                      label: `${s.code} · ${s.name}`,
                    })),
                  ]}
                />
                <Field
                  label="Material"
                  value={form.material}
                  onChange={(v) => setForm({ ...form, material: v })}
                />
                <Field
                  label="Index"
                  value={form.index}
                  onChange={(v) => setForm({ ...form, index: v })}
                />
                <Field
                  label="Cost price"
                  type="number"
                  value={form.costPrice}
                  onChange={(v) => setForm({ ...form, costPrice: v })}
                />
                <Field
                  label="Selling price"
                  type="number"
                  value={form.sellingPrice}
                  onChange={(v) => setForm({ ...form, sellingPrice: v })}
                />
              </>
            ) : (
              <>
                <Field
                  label="Extra code"
                  value={form.code}
                  onChange={(v) => setForm({ ...form, code: v })}
                />
                <Field
                  label="Type"
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={["tint", "coating", "hardening", "other"].map(
                    (x) => ({ value: x, label: x }),
                  )}
                />
                <Field
                  label="Description"
                  value={form.description}
                  onChange={(v) => setForm({ ...form, description: v })}
                />
                <Field
                  label="Supplier"
                  value={form.supplierId}
                  onChange={(v) => setForm({ ...form, supplierId: v })}
                  options={[
                    { value: "", label: "Select supplier" },
                    ...suppliers.map((s) => ({
                      value: s._id,
                      label: `${s.code} · ${s.name}`,
                    })),
                  ]}
                />
                <Field
                  label="Cost price"
                  type="number"
                  value={form.costPrice}
                  onChange={(v) => setForm({ ...form, costPrice: v })}
                />
                <Field
                  label="Selling price"
                  type="number"
                  value={form.sellingPrice}
                  onChange={(v) => setForm({ ...form, sellingPrice: v })}
                />
              </>
            )}
            <Field
              className="md:col-span-2 xl:col-span-4"
              label="Notes"
              type="textarea"
              value={form.notes}
              onChange={(v) => setForm({ ...form, notes: v })}
            />
            <div className="flex gap-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
                {editing ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </Section>
      )}
      <Section number={show ? "03" : "02"} title={`${title} register`}>
        <div className="relative mb-5 max-w-xl">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
          />
        </div>
        <Table
          rows={filtered}
          empty={`No ${title.toLowerCase()} found.`}
          columns={
            tab === "suppliers"
              ? [
                  { key: "code", label: "Code" },
                  {
                    key: "name",
                    label: "Supplier",
                    render: (r) => (
                      <div>
                        <div className="font-semibold text-slate-900">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.contactPerson || r.email || "No contact"}
                        </div>
                      </div>
                    ),
                  },
                  { key: "phone", label: "Phone" },
                  { key: "accountNumber", label: "Account" },
                  {
                    key: "actions",
                    label: "",
                    align: "right",
                    render: (r) => (
                      <button
                        onClick={() => edit(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
                    ),
                  },
                ]
              : tab === "lens"
                ? [
                    {
                      key: "code",
                      label: "Code",
                      render: (r) => (
                        <span className="font-semibold">{r.code}</span>
                      ),
                    },
                    { key: "description", label: "Description" },
                    { key: "lensType", label: "Type" },
                    {
                      key: "supplier",
                      label: "Supplier",
                      render: (r) => r.supplierId?.name || "—",
                    },
                    {
                      key: "price",
                      label: "Selling",
                      align: "right",
                      render: (r) => money(r.sellingPrice),
                    },
                    {
                      key: "actions",
                      label: "",
                      align: "right",
                      render: (r) => (
                        <button
                          onClick={() => edit(r)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold"
                        >
                          Edit
                        </button>
                      ),
                    },
                  ]
                : [
                    {
                      key: "code",
                      label: "Code",
                      render: (r) => (
                        <span className="font-semibold">{r.code}</span>
                      ),
                    },
                    { key: "type", label: "Type" },
                    { key: "description", label: "Description" },
                    {
                      key: "supplier",
                      label: "Supplier",
                      render: (r) => r.supplierId?.name || "—",
                    },
                    {
                      key: "price",
                      label: "Selling",
                      align: "right",
                      render: (r) => money(r.sellingPrice),
                    },
                    {
                      key: "actions",
                      label: "",
                      align: "right",
                      render: (r) => (
                        <button
                          onClick={() => edit(r)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold"
                        >
                          Edit
                        </button>
                      ),
                    },
                  ]
          }
        />
      </Section>
      <Section number="04" title="Catalogue workflow">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Suppliers", "Maintain supplier identity, contacts and accounts."],
            [
              "Lens codes",
              "Define spectacle lens type, material, index and pricing.",
            ],
            [
              "Lens extras",
              "Configure tint, coating, hardening and other extras.",
            ],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-sm font-semibold text-slate-800">{t}</div>
              <div className="mt-1 text-xs text-slate-400">{d}</div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentShell>
  );
}
