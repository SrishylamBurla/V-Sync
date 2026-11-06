import { Save, Plus, Trash2, Printer } from "lucide-react";

export function DocumentShell({
  eyebrow,
  title,
  subtitle,
  code,
  status,
  actions,
  children,
  aside,
}) {
  return (
    <div className="vsync-document-shell space-y-3 py-3 sm:py-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            {actions}
          </div>
        )}
      </div>

      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,35,65,0.045)] print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {code || "V-Sync record"}
              </div>
              <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                {title}
              </h2>
            </div>
            {status && (
              <span className="inline-flex w-fit items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
                {status}
              </span>
            )}
          </div>
        </header>

        <div className={aside ? "grid lg:grid-cols-[minmax(0,1fr)_250px]" : ""}>
          <div className="min-w-0">{children}</div>
          {aside && (
            <aside className="border-t border-slate-200 bg-slate-50/70 p-4 lg:border-l lg:border-t-0">
              {aside}
            </aside>
          )}
        </div>

        <footer className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[10px] font-medium text-slate-400 sm:px-5">
          V-Sync <span className="mx-1.5 text-slate-300">/</span> Practice Management
        </footer>
      </article>
    </div>
  );
}

export function Section({ number, title, description, children }) {
  return (
    <section className="border-b border-slate-200 p-4 last:border-b-0 sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        {number && (
          <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-indigo-50 px-1 text-[9px] font-bold text-indigo-600">
            {number}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options,
  className = "",
  disabled = false,
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      {options ? (
        <select
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50"
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50"
        />
      )}
    </label>
  );
}

export function InfoGrid({ items }) {
  return (
    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.key || item.label || index} className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {item.label}
          </div>
          <div className="mt-1 break-words text-xs font-semibold text-slate-700">
            {item.value || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Table({ columns, rows, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 ${column.align === "right" ? "text-right" : "text-left"}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={row.id || row._id || index}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2.5 text-[11px] text-slate-600 ${column.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-xs text-slate-400">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActionBar({ onSave, onPrint, saveLabel = "Save" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        <Save size={14} />
        {saveLabel}
      </button>
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Printer size={14} />
          Print
        </button>
      )}
    </div>
  );
}

export function RepeatableRows({ rows, setRows, fields }) {
  return (
    <div className="space-y-2.5">
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-2.5 md:grid-cols-4">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                value={row[field.key]}
                onChange={(value) =>
                  setRows(
                    rows.map((current, rowIndex) =>
                      rowIndex === index ? { ...current, [field.key]: value } : current,
                    ),
                  )
                }
                options={field.options}
              />
            ))}
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, rowIndex) => rowIndex !== index))}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50"
              aria-label="Remove row"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, Object.fromEntries(fields.map((field) => [field.key, ""]))])}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
      >
        <Plus size={13} /> Add row
      </button>
    </div>
  );
}

export function Tabs({ items, active, setActive }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setActive(item)}
          className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[11px] font-semibold transition ${active === item ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
