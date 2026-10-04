import { Navigate } from "react-router-dom";

/**
 * Booking has one UI: the booking modal inside AppointmentsPage.
 * This route simply opens that same workflow.
 */
export default function BookAppointmentPage() {
  return <Navigate to="/appointments?book=1" replace />;
}
