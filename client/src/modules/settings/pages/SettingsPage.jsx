import { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import {
  DocumentShell,
  Section,
  Field,
} from "../../../components/common/DocumentUI";
import { getPracticeSettings, updatePracticeSettings } from "../settings.api";

const FieldRow = ({ children }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
);
export default function SettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await getPracticeSettings();
      setData(r?.data || r);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load settings");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const set = (section, key, value) =>
    setData((d) => ({ ...d, [section]: { ...d?.[section], [key]: value } }));
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const r = await updatePracticeSettings(data);
      setData(r?.data || data);
      setMessage("Practice settings saved successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <DocumentShell
        eyebrow="Maintenance"
        title="Practice Configuration"
        subtitle="Configure VividOpt defaults and operational parameters."
        code="SETTINGS"
      >
        <div className="p-10 text-center text-sm text-slate-400">
          Loading settings...
        </div>
      </DocumentShell>
    );
  if (!data)
    return (
      <DocumentShell
        eyebrow="Maintenance"
        title="Practice Configuration"
        code="SETTINGS"
      >
        <div className="p-10 text-sm text-red-600">{error}</div>
      </DocumentShell>
    );
  return (
    <DocumentShell
      eyebrow="Maintenance"
      title="Practice Configuration"
      subtitle="Central configuration for appointments, recalls, consultation, dispensing, billing and communication."
      code="SETTINGS"
      actions={
        <>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
          >
            <RefreshCw size={14} />
            Reload
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      <Section number="01" title="Practice">
        <Field
          label="Practice name"
          value={data.practiceName || ""}
          onChange={(v) => setData((d) => ({ ...d, practiceName: v }))}
        />
      </Section>
      <Section number="02" title="Appointment setup">
        <FieldRow>
          <Field
            label="Opening hour"
            type="number"
            value={data.appointment?.startHour ?? 9}
            onChange={(v) => set("appointment", "startHour", Number(v))}
          />
          <Field
            label="Closing hour"
            type="number"
            value={data.appointment?.endHour ?? 18}
            onChange={(v) => set("appointment", "endHour", Number(v))}
          />
          <Field
            label="Default duration (minutes)"
            type="number"
            value={data.appointment?.defaultDurationMinutes ?? 30}
            onChange={(v) =>
              set("appointment", "defaultDurationMinutes", Number(v))
            }
          />
          <Field
            label="Colour appointments by"
            type="select"
            options={[
              { value: "optometrist", label: "Optometrist" },
              { value: "type", label: "Appointment type" },
            ]}
            value={data.appointment?.colourBy || "optometrist"}
            onChange={(v) => set("appointment", "colourBy", v)}
          />
        </FieldRow>
      </Section>
      <Section number="03" title="Recall periods">
        <FieldRow>
          <Field
            label="First recall (months)"
            type="number"
            value={data.recall?.firstMonths ?? 24}
            onChange={(v) => set("recall", "firstMonths", Number(v))}
          />
          <Field
            label="Second recall"
            type="number"
            value={data.recall?.secondMonths ?? 36}
            onChange={(v) => set("recall", "secondMonths", Number(v))}
          />
          <Field
            label="Third recall"
            type="number"
            value={data.recall?.thirdMonths ?? 48}
            onChange={(v) => set("recall", "thirdMonths", Number(v))}
          />
          <Field
            label="Fourth recall"
            type="number"
            value={data.recall?.fourthMonths ?? 60}
            onChange={(v) => set("recall", "fourthMonths", Number(v))}
          />
          <Field
            label="Fifth recall (0 = off)"
            type="number"
            value={data.recall?.fifthMonths ?? 0}
            onChange={(v) => set("recall", "fifthMonths", Number(v))}
          />
          <Field
            label="Default recall letter"
            value={data.recall?.defaultLetter || "Recall"}
            onChange={(v) => set("recall", "defaultLetter", v)}
          />
        </FieldRow>
      </Section>
      <Section number="04" title="Consultation defaults">
        <FieldRow>
          <Field
            label="Spectacle Rx expiry (months)"
            type="number"
            value={data.consultation?.spectaclePrescriptionExpiryMonths ?? 24}
            onChange={(v) =>
              set(
                "consultation",
                "spectaclePrescriptionExpiryMonths",
                Number(v),
              )
            }
          />
          <Field
            label="Contact lens Rx expiry (months)"
            type="number"
            value={data.consultation?.contactLensPrescriptionExpiryMonths ?? 12}
            onChange={(v) =>
              set(
                "consultation",
                "contactLensPrescriptionExpiryMonths",
                Number(v),
              )
            }
          />
          <Field
            label="Clinical headings"
            type="textarea"
            value={(data.consultation?.headings || []).join("\n")}
            onChange={(v) =>
              set(
                "consultation",
                "headings",
                v
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          />
          <Field
            label="Rx headings"
            type="textarea"
            value={(data.consultation?.rxHeadings || []).join("\n")}
            onChange={(v) =>
              set(
                "consultation",
                "rxHeadings",
                v
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          />
        </FieldRow>
      </Section>
      <Section number="05" title="Dispensing & billing">
        <FieldRow>
          <Field
            label="Default dispensing due days"
            type="number"
            value={data.dispensing?.defaultDueDays ?? 7}
            onChange={(v) => set("dispensing", "defaultDueDays", Number(v))}
          />
          <Field
            label="Automatic notification"
            type="select"
            options={[
              { value: "false", label: "Off" },
              { value: "true", label: "On" },
            ]}
            value={String(data.dispensing?.autoNotify ?? false)}
            onChange={(v) => set("dispensing", "autoNotify", v === "true")}
          />
          <Field
            label="Currency"
            value={data.billing?.currency || "INR"}
            onChange={(v) => set("billing", "currency", v)}
          />
          <Field
            label="Tax %"
            type="number"
            value={data.billing?.taxPercent ?? 0}
            onChange={(v) => set("billing", "taxPercent", Number(v))}
          />
          <Field
            label="Invoice prefix"
            value={data.billing?.invoicePrefix || "INV"}
            onChange={(v) => set("billing", "invoicePrefix", v)}
          />
          <Field
            label="Receipt prefix"
            value={data.billing?.receiptPrefix || "REC"}
            onChange={(v) => set("billing", "receiptPrefix", v)}
          />
        </FieldRow>
      </Section>
      <Section number="06" title="Communication">
        <FieldRow>
          <Field
            label="Email enabled"
            type="select"
            options={[
              { value: "false", label: "Off" },
              { value: "true", label: "On" },
            ]}
            value={String(data.communication?.emailEnabled ?? false)}
            onChange={(v) => set("communication", "emailEnabled", v === "true")}
          />
          <Field
            label="SMS enabled"
            type="select"
            options={[
              { value: "false", label: "Off" },
              { value: "true", label: "On" },
            ]}
            value={String(data.communication?.smsEnabled ?? false)}
            onChange={(v) => set("communication", "smsEnabled", v === "true")}
          />
          <Field
            label="Sender name"
            value={data.communication?.senderName || "VividOpt"}
            onChange={(v) => set("communication", "senderName", v)}
          />
        </FieldRow>
      </Section>
    </DocumentShell>
  );
}
