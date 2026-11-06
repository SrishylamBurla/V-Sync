import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const rootPages = new Set([
  "/dashboard", "/patients", "/appointments", "/clinical", "/dispensing",
  "/inventory", "/lab", "/catalogue", "/billing", "/finance", "/reports",
  "/recall", "/communications", "/newsletters", "/admin/organizations",
  "/branches", "/staff", "/settings",
]);

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  if (!location.pathname || rootPages.has(location.pathname) || location.pathname === "/login") return null;

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
      >
        <ArrowLeft size={14} />
        Back
      </button>
    </div>
  );
}
