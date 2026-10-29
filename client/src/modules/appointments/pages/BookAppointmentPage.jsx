// import { Navigate } from "react-router-dom";

// /**
//  * Booking has one UI: the booking modal inside AppointmentsPage.
//  * This route simply opens that same workflow.
//  */
// export default function BookAppointmentPage() {
//   return <Navigate to="/appointments?book=1" replace />;
// }
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, LoaderCircle } from "lucide-react";

/**
 * Keep one booking workflow across the app:
 * opening this route redirects to the booking modal in AppointmentsPage.
 */
export default function BookAppointmentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/appointments?book=1", { replace: true });
  }, [navigate]);

  return (
    <main className="relative flex min-h-[65vh] items-center justify-center overflow-hidden px-3 py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_32%)]" />

      <section
        aria-live="polite"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-4"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-200/70">
          <CalendarDays size={27} strokeWidth={1.8} />
        </div>

        <p className="mt-4 text-[12px] font-black uppercase tracking-[0.22em] text-violet-600">
          Appointment management
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Opening appointment booking
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
          Taking you to the appointment scheduler to choose a visit type, date, and clinician.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          <LoaderCircle size={15} className="animate-spin text-violet-600" />
          Redirecting to scheduler
          <ArrowRight size={14} className="text-slate-400" />
        </div>
      </section>
    </main>
  );
}
