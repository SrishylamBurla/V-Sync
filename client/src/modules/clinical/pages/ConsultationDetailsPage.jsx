import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Eye,
  FileText,
  Glasses,
  Loader2,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getConsultation } from "../consultation.api";

const getPatientName = (patient) => {
  if (!patient) return "Unknown Patient";

  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown Patient";
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (!value.length) return "—";

    return value
      .map((item) =>
        typeof item === "object"
          ? JSON.stringify(item)
          : String(item),
      )
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(
        ([, val]) =>
          val !== "" &&
          val !== null &&
          val !== undefined,
      )
      .map(
        ([key, val]) =>
          `${key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (char) => char.toUpperCase())}: ${
            typeof val === "object"
              ? JSON.stringify(val)
              : val
          }`,
      )
      .join(" • ");
  }

  return String(value);
};

const typeLabel = (type) => {
  switch (type) {
    case "comprehensive":
      return "Comprehensive";
    case "short_consult":
      return "Short Consultation";
    case "binocular_vision":
      return "Binocular Vision";
    case "low_vision":
      return "Low Vision";
    case "contact_lenses":
      return "Contact Lens";
    default:
      return type || "Consultation";
  }
};

function Section({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Icon size={17} />
        </div>

        <h2 className="text-sm font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="min-h-5 text-sm text-slate-700">
        {formatValue(value)}
      </div>
    </div>
  );
}

function PrescriptionTable({
  title,
  prescription,
}) {
  if (!prescription) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-left text-xs text-slate-400">
              <th className="px-4 py-3">Eye</th>
              <th className="px-4 py-3">Sphere</th>
              <th className="px-4 py-3">Cylinder</th>
              <th className="px-4 py-3">Axis</th>
              <th className="px-4 py-3">VA</th>
              <th className="px-4 py-3">Near VA</th>
              <th className="px-4 py-3">Add</th>
              <th className="px-4 py-3">Prism</th>
              <th className="px-4 py-3">Base</th>
            </tr>
          </thead>

          <tbody>
            {["right", "left"].map((eye) => {
              const row = prescription?.[eye] || {};

              return (
                <tr
                  key={eye}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {eye === "right" ? "OD" : "OS"}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.sphere)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.cylinder)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.axis)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.va)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.nearVa)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.add)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.prism)}
                  </td>

                  <td className="px-4 py-3">
                    {formatValue(row.base)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ConsultationDetailsPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!consultationId) {
        setError("Consultation ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getConsultation(consultationId);

        const data =
          response?.data?.consultation ||
          response?.data ||
          response?.consultation ||
          null;

        if (!data) {
          throw new Error(
            "Consultation record not found.",
          );
        }

        if (mounted) {
          setConsultation(data);
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load consultation.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [consultationId]);

  const patient = consultation?.patientId;

  const patientName = useMemo(
    () => getPatientName(patient),
    [patient],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading consultation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/clinical")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Clinical
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/clinical")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Clinical
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Stethoscope size={22} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    Consultation Details
                  </h1>

                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {typeLabel(
                      consultation.consultationType,
                    )}
                  </span>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {consultation.status || "Completed"}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound size={14} />
                    {patientName}
                  </span>

                  <span>
                    Patient ID:{" "}
                    {patient?.patientNumber || "—"}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatDate(
                      consultation.consultationDate,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {patient?._id && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/patients/${patient._id}`)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserRound size={16} />
                Open Patient
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* BASIC */}
        <Section
          title="Consultation Information"
          icon={ClipboardList}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Consultation Date"
              value={formatDateTime(
                consultation.consultationDate,
              )}
            />

            <Field
              label="Consultation Type"
              value={typeLabel(
                consultation.consultationType,
              )}
            />

            <Field
              label="Optometrist / Doctor"
              value={
                consultation.optometristId
                  ? `${consultation.optometristId.firstName || ""} ${
                      consultation.optometristId.lastName || ""
                    }`.trim()
                  : "—"
              }
            />

            <Field
              label="Status"
              value={consultation.status}
            />

            <Field
              label="Reason for Visit"
              value={consultation.reasonForVisit}
            />

            <Field
              label="Symptoms"
              value={consultation.symptoms}
            />

            <Field
              label="Medical History"
              value={consultation.medicalHistory}
            />

            <Field
              label="Ocular History"
              value={consultation.ocularHistory}
            />
          </div>
        </Section>

        {/* VISUAL ACUITY */}
        {consultation.visualAcuity && (
          <Section
            title="Visual Acuity"
            icon={Eye}
          >
            <Field
              label="Visual Acuity"
              value={consultation.visualAcuity}
            />
          </Section>
        )}

        {/* REFRACTION */}
        <Section
          title="Refraction & Prescription"
          icon={Glasses}
        >
          <div className="space-y-5">
            <PrescriptionTable
              title="Previous Rx"
              prescription={consultation.previousRx}
            />

            <PrescriptionTable
              title="Objective Rx"
              prescription={consultation.objectiveRx}
            />

            <PrescriptionTable
              title="Subjective Rx"
              prescription={consultation.subjectiveRx}
            />

            <PrescriptionTable
              title="Final Rx"
              prescription={consultation.finalRx}
            />

            <PrescriptionTable
              title="Given Rx"
              prescription={consultation.givenRx}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="PD"
                value={consultation.pd}
              />

              <Field
                label="Refraction Notes"
                value={
                  consultation.refractionNotes
                }
              />
            </div>
          </div>
        </Section>

        {/* BINOCULAR */}
        {consultation.binocularVision && (
          <Section
            title="Binocular Vision"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(
                consultation.binocularVision,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* TESTS */}
        <Section
          title="Clinical Management & Tests"
          icon={Stethoscope}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Slit Lamp"
              value={consultation.slitLamp}
            />

            <Field
              label="Fundus"
              value={consultation.fundus}
            />

            <Field
              label="Ophthalmoscopy"
              value={
                consultation.ophthalmoscopy
              }
            />

            <Field
              label="Biomicroscopy"
              value={
                consultation.biomicroscopy
              }
            />

            <Field
              label="Visual Field"
              value={
                consultation.visualField
              }
            />

            <Field
              label="Colour Vision"
              value={
                consultation.colourVision
              }
            />

            <Field
              label="Other Tests"
              value={consultation.otherTests}
            />

            <Field
              label="Diagnosis"
              value={consultation.diagnosis}
            />

            <Field
              label="Advice"
              value={consultation.advice}
            />

            <Field
              label="Therapeutics"
              value={
                consultation.therapeutics
              }
            />
          </div>
        </Section>

        {/* LOW VISION */}
        {consultation.lowVision && (
          <Section
            title="Low Vision Management"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(
                consultation.lowVision,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* CONTACT LENS */}
        {(consultation.contactLens ||
          consultation.contactLenses) && (
          <Section
            title="Contact Lens Management"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(
                consultation.contactLens ||
                  consultation.contactLenses ||
                  {},
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* DISPENSING */}
        {consultation.dispensing && (
          <Section
            title="Dispensing"
            icon={Glasses}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(
                consultation.dispensing,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* NOTES */}
        <Section
          title="Clinical Notes & Instructions"
          icon={FileText}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Clinical Notes"
              value={consultation.clinicalNotes}
            />

            <Field
              label="Patient Instructions"
              value={
                consultation.patientInstructions
              }
            />

            <Field
              label="Internal Notes"
              value={consultation.internalNotes}
            />

            <Field
              label="Notes"
              value={consultation.notes}
            />

            <Field
              label="Recall Due"
              value={formatDate(
                consultation.recallDue ||
                  consultation.recall?.due,
              )}
            />

            <Field
              label="Recall Letter"
              value={
                consultation.recallLetter ||
                consultation.recall?.message
              }
            />
          </div>
        </Section>

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-400">
            Created:{" "}
            {formatDateTime(
              consultation.createdAt,
            )}
          </div>

          <div className="text-xs text-slate-400">
            Updated:{" "}
            {formatDateTime(
              consultation.updatedAt,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}