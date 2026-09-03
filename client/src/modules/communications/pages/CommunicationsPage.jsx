import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getLetters,
  createLetter,
  updateLetter,
  getClinicalImages,
  createClinicalImage,
  deleteClinicalImage,
} from "../communications.api"
import { getPatients } from "../../patients/patient.api";
import {
  DocumentShell,
  Section,
  Field,
  Table,
} from "../../../components/common/DocumentUI";
const full = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
export default function CommunicationsPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("letters");
  const [letters, setLetters] = useState([]);
  const [images, setImages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [showLetter, setShowLetter] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const blankLetter = {
    patientId: "",
    title: "",
    template: "",
    body: "",
    status: "draft",
  };
  const blankImage = {
    patientId: "",
    title: "",
    category: "clinical_photo",
    imageUrl: "",
    notes: "",
    capturedAt: new Date().toISOString().slice(0, 16),
  };
  const [letter, setLetter] = useState(blankLetter);
  const [image, setImage] = useState(blankImage);
  const load = async () => {
    try {
      const [l, i, p] = await Promise.all([
        getLetters(),
        getClinicalImages(),
        getPatients({ limit: 300 }),
      ]);
      setLetters(l?.data || []);
      setImages(i?.data || []);
      const patientRows = Array.isArray(p?.data)
        ? p.data
        : Array.isArray(p?.data?.patients)
        ? p.data.patients
        : Array.isArray(p?.data?.data)
        ? p.data.data
        : Array.isArray(p)
        ? p
        : [];
      setPatients(patientRows);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load communications");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const filteredLetters = useMemo(
    () =>
      letters.filter((x) =>
        `${full(x.patientId)} ${x.patientId?.patientNumber || ""} ${x.title}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [letters, query],
  );
  const filteredImages = useMemo(
    () =>
      images.filter((x) =>
        `${full(x.patientId)} ${x.patientId?.patientNumber || ""} ${x.title}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [images, query],
  );
  const saveLetter = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createLetter(letter);
      setShowLetter(false);
      setLetter(blankLetter);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save letter");
    }
  };
  const saveImage = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createClinicalImage(image);
      setShowImage(false);
      setImage(blankImage);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save image");
    }
  };
  return (
    <DocumentShell
      eyebrow="Patient records"
      title="Letters & Clinical Images"
      subtitle="Patient correspondence, clinical photographs, scans and drawings in one document workspace."
      code="PATIENT DOCUMENTS"
      actions={
        <>
          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            Refresh
          </button>
          <button
            onClick={() =>
              tab === "letters" ? setShowLetter(true) : setShowImage(true)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            {tab === "letters" ? "New letter" : "Add image"}
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Section number="01" title="Document type">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("letters")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${tab === "letters" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"}`}
          >
            <FileText size={14} />
            Patient letters
          </button>
          <button
            onClick={() => setTab("images")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${tab === "images" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"}`}
          >
            <ImageIcon size={14} />
            Clinical images & drawings
          </button>
        </div>
      </Section>
      <Section
        number="02"
        title={
          tab === "letters"
            ? "Patient letter register"
            : "Clinical image register"
        }
      >
        <div className="relative mb-5 max-w-xl">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, number or document title..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
          />
        </div>
        {tab === "letters" ? (
          <Table
            columns={[
              {
                key: "patient",
                label: "Patient",
                render: (r) => (
                  <button
                    onClick={() => nav(`/patients/${r.patientId?._id}`)}
                    className="text-left"
                  >
                    <span className="block font-semibold text-slate-900 hover:underline">
                      {full(r.patientId)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {r.patientId?.patientNumber}
                    </span>
                  </button>
                ),
              },
              {
                key: "title",
                label: "Letter",
                render: (r) => <span className="font-semibold">{r.title}</span>,
              },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className="rounded-full border px-2 py-1 text-[10px] font-bold uppercase">
                    {r.status}
                  </span>
                ),
              },
              {
                key: "date",
                label: "Created",
                render: (r) =>
                  new Date(r.createdAt).toLocaleDateString("en-IN"),
              },
              {
                key: "actions",
                label: "Actions",
                render: (r) => (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const w = window.open("", "_blank");
                        if (w) {
                          w.document.write(
                            `<html><body style="font:14px Arial;padding:30px"><h2>${r.title}</h2><p>${full(r.patientId)}</p><pre style="white-space:pre-wrap">${r.body.replaceAll("<", "&lt;")}</pre></body></html>`,
                          );
                          w.document.close();
                          w.print();
                        }
                      }}
                      className="rounded-lg border px-2 py-1.5 text-[10px] font-bold"
                    >
                      <Printer size={11} className="mr-1 inline" />
                      Print
                    </button>
                    <button
                      onClick={() => nav(`/patients/${r.patientId?._id}`)}
                      className="rounded-lg border px-2 py-1.5 text-[10px] font-bold"
                    >
                      Patient
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filteredLetters}
            empty="No patient letters found."
          />
        ) : (
          <Table
            columns={[
              {
                key: "patient",
                label: "Patient",
                render: (r) => (
                  <button
                    onClick={() => nav(`/patients/${r.patientId?._id}`)}
                    className="text-left font-semibold text-slate-900 hover:underline"
                  >
                    {full(r.patientId)}
                    <span className="ml-2 text-[10px] text-slate-400">
                      {r.patientId?.patientNumber}
                    </span>
                  </button>
                ),
              },
              { key: "title", label: "Title" },
              {
                key: "category",
                label: "Type",
                render: (r) => r.category.replaceAll("_", " "),
              },
              {
                key: "capturedAt",
                label: "Captured",
                render: (r) => new Date(r.capturedAt).toLocaleString("en-IN"),
              },
              {
                key: "preview",
                label: "Preview",
                render: (r) => (
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    className="h-12 w-16 rounded-lg object-cover border"
                  />
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (r) => (
                  <button
                    onClick={async () => {
                      if (confirm("Delete this clinical image?")) {
                        try {
                          await deleteClinicalImage(r._id);
                          load();
                        } catch (e) {
                          setError(
                            e?.response?.data?.message ||
                              "Unable to delete image",
                          );
                        }
                      }
                    }}
                    className="rounded-lg border border-red-100 px-2 py-1.5 text-[10px] font-bold text-red-600"
                  >
                    <Trash2 size={11} className="mr-1 inline" />
                    Delete
                  </button>
                ),
              },
            ]}
            rows={filteredImages}
            empty="No clinical images found."
          />
        )}
      </Section>
      <Section number="03" title="Patient document workflow">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Letter", "Write and retain patient correspondence"],
            ["Scan", "Store imported patient documents"],
            ["Photograph", "Keep clinical photographs with the patient"],
            ["Drawing", "Retain clinical drawings and annotations"],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-sm font-bold text-slate-800">{t}</div>
              <div className="mt-1 text-xs text-slate-500">{d}</div>
            </div>
          ))}
        </div>
      </Section>
      {showLetter && (
        <Modal title="New patient letter" onClose={() => setShowLetter(false)}>
          <form onSubmit={saveLetter} className="grid gap-4 md:grid-cols-2">
            <Field
              label="Patient"
              value={letter.patientId}
              onChange={(v) => setLetter({ ...letter, patientId: v })}
              options={patients.map((p) => ({
                value: p._id,
                label: `${full(p)} · ${p.patientNumber}`,
              }))}
            />
            <Field
              label="Title"
              value={letter.title}
              onChange={(v) => setLetter({ ...letter, title: v })}
              placeholder="Referral letter"
            />
            <Field
              label="Template"
              value={letter.template}
              onChange={(v) => setLetter({ ...letter, template: v })}
              placeholder="Optional template name"
            />
            <Field
              label="Status"
              value={letter.status}
              onChange={(v) => setLetter({ ...letter, status: v })}
              options={["draft", "final"]}
            />
            <Field
              className="md:col-span-2"
              label="Letter body"
              type="textarea"
              value={letter.body}
              onChange={(v) => setLetter({ ...letter, body: v })}
              placeholder="Write the patient letter..."
            />
            <div className="md:col-span-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
                Save letter
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImage && (
        <Modal
          title="Add clinical image / drawing"
          onClose={() => setShowImage(false)}
        >
          <form onSubmit={saveImage} className="grid gap-4 md:grid-cols-2">
            <Field
              label="Patient"
              value={image.patientId}
              onChange={(v) => setImage({ ...image, patientId: v })}
              options={patients.map((p) => ({
                value: p._id,
                label: `${full(p)} · ${p.patientNumber}`,
              }))}
            />
            <Field
              label="Title"
              value={image.title}
              onChange={(v) => setImage({ ...image, title: v })}
              placeholder="Right eye photograph"
            />
            <Field
              label="Category"
              value={image.category}
              onChange={(v) => setImage({ ...image, category: v })}
              options={[
                { value: "clinical_photo", label: "Clinical photograph" },
                { value: "scan", label: "Scan" },
                { value: "drawing", label: "Drawing" },
                { value: "document", label: "Document" },
                { value: "other", label: "Other" },
              ]}
            />
            <Field
              label="Captured at"
              type="datetime-local"
              value={image.capturedAt}
              onChange={(v) => setImage({ ...image, capturedAt: v })}
            />
            <Field
              className="md:col-span-2"
              label="Image URL or data URL"
              value={image.imageUrl}
              onChange={(v) => setImage({ ...image, imageUrl: v })}
              placeholder="https://... or data:image/..."
            />
            <Field
              className="md:col-span-2"
              label="Notes"
              type="textarea"
              value={image.notes}
              onChange={(v) => setImage({ ...image, notes: v })}
            />
            {image.imageUrl && (
              <div className="md:col-span-2">
                <img
                  src={image.imageUrl}
                  alt="Preview"
                  className="max-h-64 rounded-xl border object-contain"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
                Save image
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DocumentShell>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-500"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
