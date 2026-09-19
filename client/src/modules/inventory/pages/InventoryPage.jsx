import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Check,
  ChevronRight,
  Edit3,
  Filter,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
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

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const titleCase = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  options,
  disabled = false,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </span>

      {options ? (
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={`${inputClass} h-auto resize-none py-2.5 disabled:cursor-not-allowed disabled:bg-slate-50`}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
        />
      )}
    </label>
  );
}

function StatCard({ label, value, detail, icon: Icon, danger = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <p
            className={`mt-2 text-[22px] font-bold tracking-tight ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value ?? "—"}
          </p>
          {detail && (
            <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
          )}
        </div>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-slate-50 text-slate-500"
          }`}
        >
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.22)] ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}

function stockTone(stock, reorderLevel) {
  const quantity = Number(stock || 0);
  const reorder = Number(reorderLevel || 0);

  if (quantity <= 0) return "danger";
  if (quantity <= reorder) return "warning";
  return "success";
}

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [selected, setSelected] = useState(null);
  const [adjust, setAdjust] = useState({
    quantity: "",
    reason: "",
    reference: "",
  });
  const [stocktake, setStocktake] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [stocktakeOpen, setStocktakeOpen] = useState(false);

  const load = async (searchValue = query) => {
    setLoading(true);
    setError("");

    try {
      const [inventoryResponse, summaryResponse] = await Promise.all([
        getInventory({
          category: category || undefined,
          search: searchValue || undefined,
          lowStock: lowStock ? "true" : undefined,
        }),
        getInventorySummary(),
      ]);

      setItems(inventoryResponse?.data || []);
      setSummary(summaryResponse?.data || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load inventory. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Category and low-stock are intentional server-side filters.
    // Search is submitted explicitly to avoid excessive API requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, lowStock]);

  const filtered = useMemo(() => items, [items]);

  const openCreate = () => {
    setError("");
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setError("");
    setEditing(item._id);
    setForm({ ...emptyForm, ...item });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.code.trim()) {
      setError("Item code is required.");
      return;
    }

    if (Number(form.sellingPrice) < 0 || Number(form.costPrice) < 0) {
      setError("Price values cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        code: form.code.trim(),
        barcode: form.barcode.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description.trim(),
        supplier: form.supplier.trim(),
        costPrice: Number(form.costPrice || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        stock: Number(form.stock || 0),
        reorderLevel: Number(form.reorderLevel || 0),
      };

      const response = editing
        ? await updateInventoryItem(editing, payload)
        : await createInventoryItem(payload);

      closeForm();
      await load();

      if (response?.data?._id) {
        setSelected(response.data);
        setDetailsOpen(true);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to save inventory item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (item) => {
    setSelected(item);
    setDetailsOpen(true);
  };

  const refreshSelected = async (item = selected) => {
    if (!item?._id) return;

    const response = await getInventory({
      category: category || undefined,
      search: item.code,
    });

    const refreshed =
      response?.data?.find((entry) => entry._id === item._id) || item;

    setSelected(refreshed);
  };

  const adjustStock = async () => {
    if (!selected) return;

    if (!adjust.quantity || Number(adjust.quantity) === 0) {
      setError("Enter a stock quantity greater than zero.");
      return;
    }

    if (!adjust.reason.trim()) {
      setError("A reason is required for stock adjustments.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adjustInventory(selected._id, {
        quantity: Number(adjust.quantity),
        reason: adjust.reason.trim(),
        reference: adjust.reference.trim(),
      });

      setAdjust({ quantity: "", reason: "", reference: "" });
      setAdjustOpen(false);
      await load();
      await refreshSelected();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to adjust stock.",
      );
    } finally {
      setSaving(false);
    }
  };

  const doStocktake = async () => {
    if (!selected) return;

    if (stocktake === "" || Number(stocktake) < 0) {
      setError("Enter a valid counted stock quantity.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await stocktakeInventory(selected._id, {
        countedStock: Number(stocktake),
        reason: "Routine stocktake",
      });

      setStocktake("");
      setStocktakeOpen(false);
      await load();
      await refreshSelected();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to record stocktake.",
      );
    } finally {
      setSaving(false);
    }
  };

  const totalVisible = filtered.length;

  return (
    <div className="min-h-full bg-slate-50/60 text-slate-900">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Boxes size={13} />
                Practice operations
                <ChevronRight size={12} />
                Inventory
              </div>

              <h1 className="text-[24px] font-bold tracking-tight text-slate-950 sm:text-[28px]">
                Inventory
              </h1>

              <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
                Manage frames, lenses and sundries with controlled stock,
                pricing and inventory movements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => load()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={15} />
                Add inventory
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-700"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Overview */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total items"
            value={summary?.total}
            detail="All catalogue items"
            icon={Boxes}
          />
          <StatCard
            label="Frames"
            value={summary?.frames}
            detail="Optical frames"
            icon={Archive}
          />
          <StatCard
            label="Lenses"
            value={summary?.lenses}
            detail="Lens inventory"
            icon={PackagePlus}
          />
          <StatCard
            label="Sundries"
            value={summary?.sundries}
            detail="Accessories & supplies"
            icon={Plus}
          />
          <StatCard
            label="Low stock"
            value={summary?.lowStock}
            detail="At or below reorder level"
            icon={AlertTriangle}
            danger={Number(summary?.lowStock || 0) > 0}
          />
        </section>

        {/* Inventory values */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Stock cost value
                </p>
                <p className="mt-1 text-[17px] font-bold text-slate-900">
                  {money(summary?.costValue)}
                </p>
              </div>
              <ArrowDownToLine size={17} className="text-slate-400" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Retail value
                </p>
                <p className="mt-1 text-[17px] font-bold text-slate-900">
                  {money(summary?.retailValue)}
                </p>
              </div>
              <ArrowUpFromLine size={17} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* Register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.025)]">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-bold text-slate-900">
                    Stock register
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                    {totalVisible}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Search and manage current practice inventory.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-[330px]">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") load(event.currentTarget.value);
                    }}
                    placeholder="Search code, barcode, brand, model..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 outline-none focus:border-slate-300"
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {titleCase(item)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setLowStock((value) => !value)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
                    lowStock
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  Low stock
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="h-14 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Boxes size={21} />
              </span>
              <h3 className="mt-4 text-[13px] font-bold text-slate-800">
                No inventory found
              </h3>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-400">
                Try a different search or filter, or add a new inventory item.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2.5 text-[11px] font-semibold text-white"
              >
                <Plus size={14} />
                Add inventory
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {[
                      "Item",
                      "Category",
                      "Supplier",
                      "Stock",
                      "Reorder",
                      "Selling",
                      "Status",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => {
                    const tone = stockTone(item.stock, item.reorderLevel);

                    return (
                      <tr
                        key={item._id}
                        className="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openDetails(item)}
                            className="text-left"
                          >
                            <div className="font-semibold text-[12px] text-slate-900 group-hover:text-slate-700">
                              {item.code || "—"}
                            </div>
                            <div className="mt-0.5 max-w-[280px] truncate text-[10px] text-slate-400">
                              {[
                                item.brand,
                                item.model,
                                item.description,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "No description"}
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600">
                          {titleCase(item.category)}
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {item.supplier || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <Badge tone={tone}>
                            {Number(item.stock || 0)} in stock
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {item.reorderLevel ?? 0}
                        </td>

                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-800">
                          {money(item.sellingPrice)}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              item.status === "active" ? "success" : "neutral"
                            }
                          >
                            {item.status || "active"}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 opacity-100 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-[10px] text-slate-400">
              Showing {filtered.length} inventory item
              {filtered.length === 1 ? "" : "s"}.
            </div>
          )}
        </section>

        {/* Workflow */}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            [ArrowDownToLine, "Receive", "Add received stock"],
            [ArrowUpFromLine, "Sell", "Reduce stock through sales"],
            [Check, "Stocktake", "Reconcile physical quantity"],
            [SlidersHorizontal, "Adjust", "Record a controlled variance"],
          ].map(([Icon, title, description]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Icon size={15} />
              </span>
              <div className="mt-3 text-[12px] font-bold text-slate-800">
                {title}
              </div>
              <div className="mt-1 text-[10px] leading-4 text-slate-400">
                {description}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Create / Edit */}
      {showForm && (
        <Modal
          title={editing ? "Edit inventory item" : "Add inventory item"}
          subtitle={
            editing
              ? "Update catalogue information and commercial values."
              : "Create a new frame, lens or sundry in the practice catalogue."
          }
          onClose={closeForm}
          wide
        >
          <form onSubmit={save} className="space-y-6">
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Item identity
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Category"
                  value={form.category}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, category: value }))
                  }
                  options={categories.map((value) => ({
                    value,
                    label: titleCase(value),
                  }))}
                />

                <Field
                  label="Item code *"
                  value={form.code}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, code: value }))
                  }
                  placeholder="FR-1001"
                />

                <Field
                  label="Barcode"
                  value={form.barcode}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, barcode: value }))
                  }
                  placeholder="Scan or enter barcode"
                />

                <Field
                  label="Status"
                  value={form.status}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />

                <Field
                  label="Brand"
                  value={form.brand}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, brand: value }))
                  }
                />

                <Field
                  label="Model"
                  value={form.model}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, model: value }))
                  }
                />

                <Field
                  label="Colour"
                  value={form.colour}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, colour: value }))
                  }
                />

                <Field
                  label="Size"
                  value={form.size}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, size: value }))
                  }
                />

                <Field
                  label="Material"
                  value={form.material}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, material: value }))
                  }
                />

                <Field
                  label="Index"
                  value={form.index}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, index: value }))
                  }
                />

                <Field
                  label="Supplier"
                  value={form.supplier}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supplier: value }))
                  }
                />

                <Field
                  label="Image URL"
                  value={form.imageUrl}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, imageUrl: value }))
                  }
                />

                <Field
                  label="Description"
                  value={form.description}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      description: value,
                    }))
                  }
                  className="sm:col-span-2 lg:col-span-4"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Commercial & stock
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Cost price"
                  type="number"
                  value={form.costPrice}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      costPrice: value,
                    }))
                  }
                  placeholder="0.00"
                />

                <Field
                  label="Selling price"
                  type="number"
                  value={form.sellingPrice}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      sellingPrice: value,
                    }))
                  }
                  placeholder="0.00"
                />

                <Field
                  label="Opening stock"
                  type="number"
                  value={form.stock}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      stock: value,
                    }))
                  }
                  disabled={!!editing}
                />

                <Field
                  label="Reorder level"
                  type="number"
                  value={form.reorderLevel}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      reorderLevel: value,
                    }))
                  }
                />

                <Field
                  label="Notes"
                  type="textarea"
                  value={form.notes}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, notes: value }))
                  }
                  placeholder="Internal inventory notes..."
                  className="sm:col-span-2 lg:col-span-4"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="h-10 rounded-lg border border-slate-200 px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw size={13} className="animate-spin" />
                )}
                {editing ? "Save changes" : "Create item"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details */}
      {detailsOpen && selected && (
        <Modal
          title={selected.code || "Inventory item"}
          subtitle={`${titleCase(selected.category)} · ${
            selected.brand || "No brand"
          } ${selected.model || ""}`}
          onClose={() => setDetailsOpen(false)}
          wide
        >
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Barcode", selected.barcode],
                ["Description", selected.description],
                ["Supplier", selected.supplier],
                ["Colour", selected.colour],
                ["Size", selected.size],
                ["Material", selected.material],
                ["Cost", money(selected.costPrice)],
                ["Selling", money(selected.sellingPrice)],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {key}
                  </div>
                  <div className="mt-1.5 truncate text-[11px] font-semibold text-slate-700">
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Current stock
                </div>
                <div className="mt-1 text-[24px] font-bold text-slate-900">
                  {selected.stock ?? 0}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Reorder level: {selected.reorderLevel ?? 0}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Stock status
                </div>
                <div className="mt-3">
                  <Badge
                    tone={stockTone(
                      selected.stock,
                      selected.reorderLevel,
                    )}
                  >
                    {Number(selected.stock || 0) <= 0
                      ? "Out of stock"
                      : Number(selected.stock || 0) <=
                          Number(selected.reorderLevel || 0)
                        ? "Low stock"
                        : "Healthy stock"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Catalogue status
                </div>
                <div className="mt-3">
                  <Badge
                    tone={
                      selected.status === "active" ? "success" : "neutral"
                    }
                  >
                    {selected.status || "active"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <SlidersHorizontal size={14} />
                Adjust stock
              </button>

              <button
                type="button"
                onClick={() => setStocktakeOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Check size={14} />
                Stocktake
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  openEdit(selected);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                <Edit3 size={14} />
                Edit item
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Adjustment */}
      {adjustOpen && selected && (
        <Modal
          title="Adjust stock"
          subtitle={`Controlled inventory movement for ${selected.code}.`}
          onClose={() => !saving && setAdjustOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Current stock
              </div>
              <div className="mt-1 text-[24px] font-bold text-slate-900">
                {selected.stock ?? 0}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Use positive values to add stock and negative values to remove
                stock.
              </p>
            </div>

            <Field
              label="Quantity (+ / -) *"
              type="number"
              value={adjust.quantity}
              onChange={(value) =>
                setAdjust((current) => ({
                  ...current,
                  quantity: value,
                }))
              }
              placeholder="e.g. 10 or -2"
            />

            <Field
              label="Reference"
              value={adjust.reference}
              onChange={(value) =>
                setAdjust((current) => ({
                  ...current,
                  reference: value,
                }))
              }
              placeholder="GRN, invoice, damage note..."
            />

            <Field
              label="Reason *"
              value={adjust.reason}
              onChange={(value) =>
                setAdjust((current) => ({
                  ...current,
                  reason: value,
                }))
              }
              placeholder="Received, damaged, correction..."
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                disabled={saving}
                className="h-10 rounded-lg border border-slate-200 px-4 text-[11px] font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={adjustStock}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw size={13} className="animate-spin" />
                )}
                Record adjustment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stocktake */}
      {stocktakeOpen && selected && (
        <Modal
          title="Stocktake"
          subtitle={`Reconcile physical quantity for ${selected.code}.`}
          onClose={() => !saving && setStocktakeOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    System stock
                  </div>
                  <div className="mt-1 text-[22px] font-bold text-slate-900">
                    {selected.stock ?? 0}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Physical count
                  </div>
                  <div className="mt-1 text-[22px] font-bold text-slate-900">
                    {stocktake === "" ? "—" : stocktake}
                  </div>
                </div>
              </div>
            </div>

            <Field
              label="Counted stock *"
              type="number"
              value={stocktake}
              onChange={setStocktake}
              placeholder="Enter physical quantity"
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStocktakeOpen(false)}
                disabled={saving}
                className="h-10 rounded-lg border border-slate-200 px-4 text-[11px] font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={doStocktake}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw size={13} className="animate-spin" />
                )}
                Record stocktake
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
