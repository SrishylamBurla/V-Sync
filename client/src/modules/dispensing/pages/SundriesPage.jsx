import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  createSundry,
  getSundries,
  updateSundry,
} from "../sundries.api";

const PAGE_SIZE = 20;

const emptyForm = {
  code: "",
  barcode: "",
  brand: "",
  model: "",
  description: "",
  colour: "",
  size: "",
  material: "",
  supplier: "",
  costPrice: "",
  sellingPrice: "",
  stock: "",
  reorderLevel: "",
  imageUrl: "",
  notes: "",
  status: "active",
};

export default function SundriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [adjustForm, setAdjustForm] = useState({
    quantity: "",
    reason: "",
    reference: "",
  });

  // ============================================================
  // LOAD
  // ============================================================

  const loadSundries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSundries({
        search: search.trim(),
        status,
        lowStock: lowStockOnly ? "true" : undefined,
      });

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setItems(rows);
    } catch (err) {
      setItems([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load sundries.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, lowStockOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadSundries();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadSundries]);

  // ============================================================
  // CLOSE ACTION MENU
  // ============================================================

  useEffect(() => {
    if (!menuId) return;

    const handlePointerDown = (event) => {
      if (!event.target.closest("[data-sundry-actions]")) {
        setMenuId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuId]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const visibleItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const active = items.filter((item) => item.status === "active");

    const totalStock = active.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0,
    );

    const lowStock = active.filter(
      (item) => Number(item.stock || 0) <= Number(item.reorderLevel || 0),
    ).length;

    const stockValue = active.reduce(
      (sum, item) =>
        sum + Number(item.stock || 0) * Number(item.costPrice || 0),
      0,
    );

    const retailValue = active.reduce(
      (sum, item) =>
        sum + Number(item.stock || 0) * Number(item.sellingPrice || 0),
      0,
    );

    return {
      total: items.length,
      active: active.length,
      totalStock,
      lowStock,
      stockValue,
      retailValue,
    };
  }, [items]);

  // ============================================================
  // CREATE
  // ============================================================

  const openCreate = () => {
    setMenuId(null);
    setEditingItem(null);
    setViewingItem(null);
    setForm(emptyForm);
    setShowCreate(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const openEdit = (item) => {
    setMenuId(null);
    setViewingItem(null);

    setForm({
      code: item.code || "",
      barcode: item.barcode || "",
      brand: item.brand || "",
      model: item.model || "",
      description: item.description || "",
      colour: item.colour || "",
      size: item.size || "",
      material: item.material || "",
      supplier: item.supplier || "",
      costPrice: item.costPrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      stock: item.stock ?? "",
      reorderLevel: item.reorderLevel ?? "",
      imageUrl: item.imageUrl || "",
      notes: item.notes || "",
      status: item.status || "active",
    });

    setEditingItem(item);
  };

  // ============================================================
  // SAVE
  // ============================================================

  const saveSundry = async (event) => {
    event.preventDefault();

    if (!form.code.trim()) {
      setError("Sundry code is required.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      category: "sundry",
      code: form.code.trim(),
      barcode: form.barcode.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      description: form.description.trim(),
      colour: form.colour.trim(),
      size: form.size.trim(),
      material: form.material.trim(),
      supplier: form.supplier.trim(),
      costPrice: Number(form.costPrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      stock: Math.max(Number(form.stock || 0), 0),
      reorderLevel: Math.max(Number(form.reorderLevel || 0), 0),
      imageUrl: form.imageUrl.trim(),
      notes: form.notes.trim(),
      status: form.status || "active",
    };

    try {
      if (editingItem?._id) {
        await updateSundry(editingItem._id, payload);
      } else {
        await createSundry(payload);
      }

      setShowCreate(false);
      setEditingItem(null);
      setForm(emptyForm);

      await loadSundries();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save sundry.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // STOCK ADJUSTMENT
  // ============================================================

  const openAdjust = (item) => {
    setMenuId(null);

    setAdjustItem(item);
    setAdjustForm({
      quantity: "",
      reason: "",
      reference: "",
    });
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();

    if (!adjustItem?._id) return;

    const quantity = Number(adjustForm.quantity);

    if (!Number.isFinite(quantity) || quantity === 0) {
      setError("Enter a non-zero stock adjustment.");
      return;
    }

    if (!adjustForm.reason.trim()) {
      setError("Adjustment reason is required.");
      return;
    }

    setAdjusting(true);
    setError("");

    try {
      await adjustSundry(adjustItem._id, {
        quantity,
        reason: adjustForm.reason.trim(),
        reference: adjustForm.reference.trim(),
      });

      setAdjustItem(null);

      await loadSundries();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to adjust stock.",
      );
    } finally {
      setAdjusting(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const closeForms = () => {
    if (saving) return;

    setShowCreate(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 shadow-sm">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <Package size={17} />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                  Dispensing
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                Sundries
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Manage optical accessories, consumables and other sundry
                products used across dispensing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadSundries}
                className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={14} />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
              >
                <Plus size={15} />
                Add sundry
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={Package}
          label="Sundries"
          value={summary.total}
        />

        <Metric
          icon={Package}
          label="Units in stock"
          value={summary.totalStock}
        />

        <Metric
          icon={AlertTriangle}
          label="Low stock"
          value={summary.lowStock}
          danger={summary.lowStock > 0}
        />

        <Metric
          icon={Package}
          label="Cost value"
          value={formatCurrency(summary.stockValue)}
        />

        <Metric
          icon={Package}
          label="Retail value"
          value={formatCurrency(summary.retailValue)}
        />
      </section>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search code, barcode, brand, model, supplier..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-violet-400"
          >
            <option value="active">Active sundries</option>
            <option value="inactive">Inactive sundries</option>
            <option value="">All sundries</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setLowStockOnly((current) => !current);
              setPage(1);
            }}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
              lowStockOnly
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Low stock only
          </button>
        </div>
      </section>

      {/* ======================================================
          REGISTER
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Dispensing catalogue
              </div>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Sundry register
              </h2>
            </div>

            <div className="text-xs text-slate-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <RefreshCw size={17} className="animate-spin" />
              Loading sundries...
            </div>
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3">Sundry</th>
                  <th className="px-5 py-3">Barcode</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Cost</th>
                  <th className="px-5 py-3">Selling</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => {
                  const isLow =
                    Number(item.stock || 0) <=
                    Number(item.reorderLevel || 0);

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-violet-700">
                            <Package size={17} />
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">
                              {item.description ||
                                item.model ||
                                item.brand ||
                                "Unnamed sundry"}
                            </div>

                            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                              <span>{item.code || "No code"}</span>

                              {item.brand && <span>{item.brand}</span>}

                              {item.model && <span>{item.model}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {item.barcode || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {item.supplier || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {formatCurrency(item.costPrice)}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                        {formatCurrency(item.sellingPrice)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isLow
                                ? "text-amber-700"
                                : "text-slate-800"
                            }`}
                          >
                            {Number(item.stock || 0)}
                          </span>

                          {isLow && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase text-amber-700">
                              Low
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Reorder at {Number(item.reorderLevel || 0)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            item.status === "inactive"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item.status === "inactive"
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div
                          className="relative inline-flex items-center gap-1"
                          data-sundry-actions
                        >
                          <button
                            type="button"
                            onClick={() => setViewingItem(item)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                            title="View sundry"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMenuId((current) =>
                                current === item._id ? null : item._id,
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                            title="More actions"
                          >
                            <MoreHorizontal size={17} />
                          </button>

                          {menuId === item._id && (
                            <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(null);
                                  setViewingItem(item);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                <Eye size={14} />
                                View details
                              </button>

                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                <Edit3 size={14} />
                                Edit sundry
                              </button>

                              <button
                                type="button"
                                onClick={() => openAdjust(item)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                <Package size={14} />
                                Adjust stock
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!loading && items.length > 0 && (
          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, items.length)} of {items.length}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={13} />
                  Previous
                </button>

                <span className="min-w-8 text-center text-xs font-bold text-slate-700">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </footer>
        )}
      </section>

      {/* ======================================================
          CREATE / EDIT
      ====================================================== */}

      {(showCreate || editingItem) && (
        <SundryFormModal
          title={editingItem ? "Edit sundry" : "Add sundry"}
          form={form}
          setForm={setForm}
          saving={saving}
          editing={Boolean(editingItem)}
          onClose={closeForms}
          onSubmit={saveSundry}
        />
      )}

      {/* ======================================================
          VIEW
      ====================================================== */}

      {viewingItem && (
        <SundryDetailsModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={() => openEdit(viewingItem)}
          onAdjust={() => openAdjust(viewingItem)}
        />
      )}

      {/* ======================================================
          STOCK ADJUSTMENT
      ====================================================== */}

      {adjustItem && (
        <StockAdjustmentModal
          item={adjustItem}
          form={adjustForm}
          setForm={setAdjustForm}
          saving={adjusting}
          onClose={() => setAdjustItem(null)}
          onSubmit={saveAdjustment}
        />
      )}
    </div>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({ icon: Icon, label, value, danger = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "bg-amber-50 text-amber-700"
              : "bg-gradient-to-br from-blue-50 to-violet-50 text-blue-700"
          }`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </div>

          <div className="mt-1 truncate text-xl font-bold text-slate-900">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ onAdd }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Package size={24} />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-700">
        No sundries found
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        Add your first sundry item or change the search and status filters.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
      >
        <Plus size={14} />
        Add sundry
      </button>
    </div>
  );
}

// ============================================================
// FORM MODAL
// ============================================================

function SundryFormModal({
  title,
  form,
  setForm,
  saving,
  editing,
  onClose,
  onSubmit,
}) {
  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <ModalShell title={title} onClose={onClose} size="xl">
      <form onSubmit={onSubmit}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <Field
            label="Sundry code"
            value={form.code}
            required
            onChange={(value) => update("code", value)}
            placeholder="e.g. SUN-001"
          />

          <Field
            label="Barcode"
            value={form.barcode}
            onChange={(value) => update("barcode", value)}
            placeholder="Barcode"
          />

          <Field
            label="Brand"
            value={form.brand}
            onChange={(value) => update("brand", value)}
            placeholder="Brand"
          />

          <Field
            label="Model / item"
            value={form.model}
            onChange={(value) => update("model", value)}
            placeholder="Item name / model"
          />

          <Field
            label="Supplier"
            value={form.supplier}
            onChange={(value) => update("supplier", value)}
            placeholder="Supplier"
          />

          <Field
            label="Colour"
            value={form.colour}
            onChange={(value) => update("colour", value)}
            placeholder="Colour"
          />

          <Field
            label="Size"
            value={form.size}
            onChange={(value) => update("size", value)}
            placeholder="Size"
          />

          <Field
            label="Material"
            value={form.material}
            onChange={(value) => update("material", value)}
            placeholder="Material"
          />

          <Field
            label="Cost price"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={(value) => update("costPrice", value)}
            placeholder="0.00"
          />

          <Field
            label="Selling price"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={(value) => update("sellingPrice", value)}
            placeholder="0.00"
          />

          <Field
            label="Stock"
            type="number"
            min="0"
            value={form.stock}
            disabled={editing}
            onChange={(value) => update("stock", value)}
            placeholder="0"
          />

          <Field
            label="Reorder level"
            type="number"
            min="0"
            value={form.reorderLevel}
            onChange={(value) => update("reorderLevel", value)}
            placeholder="0"
          />

          <Field
            label="Image URL"
            value={form.imageUrl}
            onChange={(value) => update("imageUrl", value)}
            placeholder="https://..."
            className="lg:col-span-2"
          />

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Status
            </span>

            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="block lg:col-span-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Description
            </span>

            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                update("description", event.target.value)
              }
              placeholder="Describe the sundry..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </label>

          <label className="block lg:col-span-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Notes
            </span>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Internal notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <RefreshCw size={14} className="animate-spin" />
            )}

            {saving
              ? editing
                ? "Saving..."
                : "Creating..."
              : editing
                ? "Save changes"
                : "Create sundry"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============================================================
// DETAILS MODAL
// ============================================================

function SundryDetailsModal({ item, onClose, onEdit, onAdjust }) {
  const lowStock =
    Number(item.stock || 0) <= Number(item.reorderLevel || 0);

  return (
    <ModalShell title="Sundry details" onClose={onClose} size="lg">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
            <Package size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              {item.code || "No code"}
            </div>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {item.description ||
                item.model ||
                item.brand ||
                "Unnamed sundry"}
            </h3>

            <div className="mt-1 text-xs text-slate-500">
              {item.brand || "No brand"}
              {item.model ? ` · ${item.model}` : ""}
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
              item.status === "inactive"
                ? "bg-slate-100 text-slate-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {item.status === "inactive" ? "Inactive" : "Active"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Barcode" value={item.barcode || "—"} />
          <Info label="Supplier" value={item.supplier || "—"} />
          <Info label="Colour" value={item.colour || "—"} />
          <Info label="Size" value={item.size || "—"} />
          <Info label="Material" value={item.material || "—"} />
          <Info
            label="Cost price"
            value={formatCurrency(item.costPrice)}
          />
          <Info
            label="Selling price"
            value={formatCurrency(item.sellingPrice)}
          />

          <Info
            label="Current stock"
            value={`${Number(item.stock || 0)} ${
              lowStock ? "· Low stock" : ""
            }`}
            danger={lowStock}
          />

          <Info
            label="Reorder level"
            value={Number(item.reorderLevel || 0)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <InfoPanel
            title="Description"
            value={item.description || "No description recorded."}
          />

          <InfoPanel
            title="Notes"
            value={item.notes || "No notes recorded."}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onAdjust}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Package size={14} />
            Adjust stock
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Edit3 size={14} />
            Edit sundry
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============================================================
// STOCK ADJUSTMENT
// ============================================================

function StockAdjustmentModal({
  item,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}) {
  return (
    <ModalShell title="Adjust stock" onClose={onClose} size="md">
      <form onSubmit={onSubmit}>
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sundry
            </div>

            <div className="mt-1 text-sm font-bold text-slate-900">
              {item.description ||
                item.model ||
                item.brand ||
                "Unnamed sundry"}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {item.code} · Current stock:{" "}
              <span className="font-bold text-slate-800">
                {Number(item.stock || 0)}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Quantity adjustment"
              type="number"
              value={form.quantity}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  quantity: value,
                }))
              }
              placeholder="e.g. 10 or -2"
              required
            />

            <p className="text-[11px] leading-5 text-slate-400">
              Use a positive number to add stock and a negative number to
              remove stock.
            </p>

            <Field
              label="Reason"
              value={form.reason}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  reason: value,
                }))
              }
              placeholder="Reason for adjustment"
              required
            />

            <Field
              label="Reference"
              value={form.reference}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  reference: value,
                }))
              }
              placeholder="Optional reference"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving && (
              <RefreshCw size={14} className="animate-spin" />
            )}
            {saving ? "Updating..." : "Update stock"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============================================================
// MODAL SHELL
// ============================================================

function ModalShell({ title, onClose, children, size = "lg" }) {
  const width =
    size === "md"
      ? "max-w-lg"
      : size === "xl"
        ? "max-w-5xl"
        : "max-w-3xl";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`max-h-[92vh] w-full ${width} overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
              Dispensing
            </div>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[calc(92vh-80px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  min,
  step,
  placeholder,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

// ============================================================
// INFO
// ============================================================

function Info({ label, value, danger = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1.5 break-words text-sm font-semibold ${
          danger ? "text-amber-700" : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// INFO PANEL
// ============================================================

function InfoPanel({ title, value }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {value}
      </p>
    </section>
  );
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}