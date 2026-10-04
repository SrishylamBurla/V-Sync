import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const rootPages = new Set([
  "/dashboard",
  "/patients",
  "/appointments",
  "/clinical",
  "/dispensing",
  "/inventory",
  "/lab",
  "/catalogue",
  "/billing",
  "/finance",
  "/reports",
  "/recall",
  "/communications",
  "/newsletters",
  "/admin/organizations",
  "/branches",
  "/staff",
  "/settings",
]);

const shouldShowBackButton = (pathname) => {
  if (!pathname || rootPages.has(pathname)) return false;

  if (pathname === "/login") return false;

  return true;
};

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!shouldShowBackButton(location.pathname)) {
    return null;
  }

  return (
    <div className="pt-3 sm:pt-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft size={15} />
        Back
      </button>
    </div>
  );
}
