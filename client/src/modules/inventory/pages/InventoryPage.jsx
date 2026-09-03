import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Edit3,
  PackagePlus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  DocumentShell,
  Section,
  Field,
  Table,
} from "../../../components/common/DocumentUI";
import {
  createInventoryItem,
  getInventory,
  getInventorySummary,
  updateInventoryItem,
  adjustInventory,
  stocktakeInventory,
} from "../inventory.api";

const categories = ["frame", "lens", "sundry"];
const emptyForm = {
  category: "frame",
  code: "",
  barcode: "",
  brand: "",
  model: "",
  description: "",
  colour: "",
  size: "",
  material: "",
  index: "",
  supplier: "",
  costPrice: 0,
  sellingPrice: 0,
  stock: 0,
  reorderLevel: 0,
  imageUrl: "",
  status: "active",
  notes: "",
};
const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (s) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function InventoryPage() {
  const [items, setItems] = useState([]),
    [summary, setSummary] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [lowStock, setLowStock] = useState(false),
    [form, setForm] = useState(emptyForm),
    [editing, setEditing] = useState(null),
    [showForm, setShowForm] = useState(false),
    [selected, setSelected] = useState(null),
    [adjust, setAdjust] = useState({ quantity: "", reason: "", reference: "" }),
    [stocktake, setStocktake] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [r, s] = await Promise.all([
        getInventory({
          category: category || undefined,
          search: query || undefined,
          lowStock: lowStock ? "true" : undefined,
        }),
        getInventorySummary(),
      ]);
      setItems(r?.data || []);
      setSummary(s?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [category, lowStock]);
  const filtered = useMemo(() => items, [items]);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const r = editing
        ? await updateInventoryItem(editing, form)
        : await createInventoryItem(form);
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
      if (r?.data?._id) setSelected(r.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save inventory item");
    }
  };
  const openEdit = (i) => {
    setEditing(i._id);
    setForm({ ...emptyForm, ...i });
    setShowForm(true);
    setSelected(null);
  };
  const adjustStock = async () => {
    if (!selected) return;
    try {
      await adjustInventory(selected._id, adjust);
      setAdjust({ quantity: "", reason: "", reference: "" });
      await load();
      const r = await getInventory({
        category: category || undefined,
        search: selected.code,
      });
      setSelected(r?.data?.find((x) => x._id === selected._id) || selected);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to adjust stock");
    }
  };
  const doStocktake = async () => {
    if (!selected) return;
    try {
      await stocktakeInventory(selected._id, {
        countedStock: Number(stocktake),
        reason: "Routine stocktake",
      });
      setStocktake("");
      await load();
      setSelected(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to record stocktake");
    }
  };
  return (
    <DocumentShell
      eyebrow="Inventory control"
      title="Inventory"
      subtitle="Frames, lenses and sundries in one practice inventory document."
      code="INVENTORY"
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
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            <PackagePlus size={14} />
            New item
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Section
        number="01"
        title="Inventory overview"
        description="Current active stock across the single practice branch."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total items", summary?.total],
            ["Frames", summary?.frames],
            ["Lenses", summary?.lenses],
            ["Sundries", summary?.sundries],
            ["Low stock", summary?.lowStock],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {l}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {v ?? "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stock cost value
            </div>
            <div className="mt-1 text-lg font-bold text-slate-800">
              {money(summary?.costValue)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Retail value
            </div>
            <div className="mt-1 text-lg font-bold text-slate-800">
              {money(summary?.retailValue)}
            </div>
          </div>
        </div>
      </Section>
      {showForm && (
        <Section
          number="02"
          title={editing ? "Edit inventory item" : "Create inventory item"}
        >
          <form
            onSubmit={save}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <Field
              label="Category"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              options={categories.map((x) => ({ value: x, label: label(x) }))}
            />
            <Field
              label="Item code"
              value={form.code}
              onChange={(v) => setForm({ ...form, code: v })}
              placeholder="FR-1001"
            />
            <Field
              label="Barcode"
              value={form.barcode}
              onChange={(v) => setForm({ ...form, barcode: v })}
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
              label="Description"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
            />
            <Field
              label="Colour"
              value={form.colour}
              onChange={(v) => setForm({ ...form, colour: v })}
            />
            <Field
              label="Size"
              value={form.size}
              onChange={(v) => setForm({ ...form, size: v })}
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
              label="Supplier"
              value={form.supplier}
              onChange={(v) => setForm({ ...form, supplier: v })}
            />
            <Field
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => setForm({ ...form, imageUrl: v })}
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
            <Field
              label="Opening stock"
              type="number"
              value={form.stock}
              onChange={(v) => setForm({ ...form, stock: v })}
              disabled={!!editing}
            />
            <Field
              label="Reorder level"
              type="number"
              value={form.reorderLevel}
              onChange={(v) => setForm({ ...form, reorderLevel: v })}
            />
            <Field
              className="md:col-span-2 xl:col-span-4"
              label="Notes"
              type="textarea"
              value={form.notes}
              onChange={(v) => setForm({ ...form, notes: v })}
            />
            <div className="flex gap-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
                {editing ? "Update item" : "Create item"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </Section>
      )}
      <Section number={showForm ? "03" : "02"} title="Stock register">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search code, barcode, brand, model or supplier..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            onClick={() => setLowStock(!lowStock)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold ${lowStock ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            <SlidersHorizontal size={14} />
            Low stock
          </button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading inventory...
          </div>
        ) : (
          <Table
            columns={[
              {
                key: "code",
                label: "Code",
                render: (r) => (
                  <button
                    onClick={() => setSelected(r)}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {r.code}
                  </button>
                ),
              },
              {
                key: "category",
                label: "Type",
                render: (r) => label(r.category),
              },
              {
                key: "item",
                label: "Item",
                render: (r) => (
                  <div>
                    <div className="font-medium text-slate-700">
                      {r.brand || r.model || r.description || "—"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {r.model && r.brand
                        ? `${r.brand} · ${r.model}`
                        : r.barcode || "No barcode"}
                    </div>
                  </div>
                ),
              },
              { key: "supplier", label: "Supplier" },
              {
                key: "stock",
                label: "Stock",
                render: (r) => (
                  <span
                    className={
                      Number(r.stock) <= Number(r.reorderLevel)
                        ? "font-bold text-red-600"
                        : "font-semibold text-slate-700"
                    }
                  >
                    {r.stock}
                  </span>
                ),
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
                    onClick={() => openEdit(r)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    <Edit3 size={13} />
                    Edit
                  </button>
                ),
              },
            ]}
            rows={filtered}
            empty="No inventory items found."
          />
        )}
      </Section>
      {selected && (
        <Section number="04" title="Inventory item document">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-bold text-slate-900">
                {selected.code}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {selected.brand} {selected.model} · {label(selected.category)}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Barcode", selected.barcode],
              ["Description", selected.description],
              ["Supplier", selected.supplier],
              ["Colour", selected.colour],
              ["Size", selected.size],
              ["Material", selected.material],
              ["Cost", money(selected.costPrice)],
              ["Selling", money(selected.sellingPrice)],
              ["Current stock", selected.stock],
              ["Reorder level", selected.reorderLevel],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">
                  {v || "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Adjust stock
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Quantity (+ / -)"
                  type="number"
                  value={adjust.quantity}
                  onChange={(v) => setAdjust({ ...adjust, quantity: v })}
                />
                <Field
                  label="Reference"
                  value={adjust.reference}
                  onChange={(v) => setAdjust({ ...adjust, reference: v })}
                />
                <Field
                  className="sm:col-span-2"
                  label="Reason"
                  value={adjust.reason}
                  onChange={(v) => setAdjust({ ...adjust, reason: v })}
                  placeholder="Damaged, received, correction..."
                />
              </div>
              <button
                onClick={adjustStock}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
              >
                Record adjustment
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Stocktake
              </div>
              <Field
                label="Counted stock"
                type="number"
                value={stocktake}
                onChange={setStocktake}
              />
              <button
                onClick={doStocktake}
                className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600"
              >
                Record stocktake
              </button>
            </div>
          </div>
        </Section>
      )}
      <Section
        number={showForm ? "05" : selected ? "05" : "03"}
        title="Inventory workflow"
      >
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Receive", "Create or increase stock"],
            ["Sell", "Decrease through sales"],
            ["Stocktake", "Compare physical count"],
            ["Adjust", "Record controlled variance"],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <Boxes size={16} className="text-slate-500" />
              <div className="mt-3 text-sm font-semibold text-slate-800">
                {t}
              </div>
              <div className="mt-1 text-xs text-slate-400">{d}</div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentShell>
  );
}
