import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  Eye,
  History,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getPatients } from "../../patients/patient.api";

import { getPatientConsultations, getConsultation } from "../consultation.api";

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]

    .filter(Boolean)

    .join(" ") || "Unnamed patient";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",

        month: "short",

        year: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",
      });
};

const ageFromDob = (dob) => {
  if (!dob) return null;

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const month = now.getMonth() - birth.getMonth();

  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;

  return age >= 0 ? age : null;
};

const label = (value = "") =>
  String(value)
    .replaceAll("_", " ")

    .replace(/\b\w/g, (c) => c.toUpperCase());

const consultationLabel = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();
  const specialty = String(item?.specializedType || "").toLowerCase();
  if (type === "specialized") return label(specialty || "specialized");
  if (type === "short_consult") return "Short Consultation";
  if (type === "binocular_vision" || specialty === "binocular_vision")
    return "Binocular Vision";
  if (type === "low_vision" || specialty === "low_vision") return "Low Vision";
  if (
    ["contact_lens", "contact_lenses"].includes(type) ||
    ["contact_lens", "contact_lenses"].includes(specialty)
  )
    return "Contact Lens Consultation";
  if (type === "comprehensive") return "Comprehensive Consultation";
  return label(type || "comprehensive");
};

const consultationTone = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();
  if (
    [
      "specialized",
      "binocular_vision",
      "low_vision",
      "contact_lens",
      "contact_lenses",
    ].includes(type) ||
    item?.specializedType
  )
    return "violet";
  if (type === "short_consult") return "amber";
  return "blue";
};

const normalizePatients = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.patients)) return payload.patients;

  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const normalizeConsultations = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.consultations)) return payload.consultations;

  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

export default function ClinicalManagementPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const [patients, setPatients] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [consultations, setConsultations] = useState([]);

  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [loadingPatients, setLoadingPatients] = useState(true);

  const [loadingHistory, setLoadingHistory] = useState(false);

  const [loadingRecord, setLoadingRecord] = useState(false);

  const [error, setError] = useState("");

  const [historyFilter, setHistoryFilter] = useState("all");

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);

    setError("");

    try {
      const response = await getPatients({
        page: 1,

        limit: 40,

        search: query.trim(),

        status: "active",
      });

      setPatients(normalizePatients(response));
    } catch (requestError) {
      setPatients([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load patients.",
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPatients(), 250);

    return () => window.clearTimeout(timer);
  }, [loadPatients]);

  const selectPatient = useCallback(async (patient) => {
    if (!patient?._id) return;

    setSelectedPatient(patient);

    setSelectedConsultation(null);

    setLoadingHistory(true);

    setError("");

    try {
      const response = await getPatientConsultations(patient._id);

      const rows = normalizeConsultations(response).sort(
        (a, b) =>
          new Date(b.consultationDate || b.createdAt || 0).getTime() -
          new Date(a.consultationDate || a.createdAt || 0).getTime(),
      );

      setConsultations(rows);
    } catch (requestError) {
      setConsultations([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load consultation history.",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return consultations;

    if (historyFilter === "specialized")
      return consultations.filter(
        (item) => item.consultationType === "specialized",
      );

    return consultations.filter(
      (item) => item.consultationType === historyFilter,
    );
  }, [consultations, historyFilter]);

  const completedComprehensive = consultations.some(
    (item) =>
      item.consultationType === "comprehensive" &&
      (item.status === "completed" || !item.status),
  );

  const openConsultation = async (consultation) => {
    // Show the modal immediately, then replace the summary with the full record.
    setSelectedConsultation(consultation);
    setLoadingRecord(true);
    setError("");
    try {
      const response = await getConsultation(consultation._id);
      setSelectedConsultation(
        response?.data?.consultation ||
          response?.data?.data?.consultation ||
          response?.data ||
          response?.consultation ||
          consultation,
      );
    } catch {
      setSelectedConsultation(consultation);
    } finally {
      setLoadingRecord(false);
    }
  };

  const startConsultation = () => {
    if (!selectedPatient?._id) return;

    navigate(`/patients/${selectedPatient._id}/consultations/new`);
  };

  const startSpecialized = (specializedType) => {
    if (!selectedPatient?._id || !completedComprehensive) return;

    navigate(
      `/patients/${selectedPatient._id}/consultations/new?type=specialized&specializedType=${specializedType}`,
    );
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-3 py-5 sm:px-5 lg:px-7">
           {" "}
      <div className="mx-auto max-w-[1600px] space-y-5">
               {" "}
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
                   {" "}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                       {" "}
            <div>
                           {" "}
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
                                Patient care workspace              {" "}
              </div>
                           {" "}
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                Clinical Management              {" "}
              </h1>
                           {" "}
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                                Find a patient, review their clinical history
                and start the next                 consultation. Appointment
                scheduling is managed separately.              {" "}
              </p>
                         {" "}
            </div>
                       {" "}
            <button
              type="button"
              onClick={() => void loadPatients()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
                           {" "}
              <RefreshCw
                size={14}
                className={loadingPatients ? "animate-spin" : ""}
              />{" "}
                            Refresh patients            {" "}
            </button>
                     {" "}
          </div>
                 {" "}
        </header>
               {" "}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                        <span>{error}</span>           {" "}
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
                            <X size={14} />           {" "}
            </button>
                     {" "}
          </div>
        )}
               {" "}
        <section className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
                   {" "}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[92px] xl:self-start">
                       {" "}
            <div className="border-b border-slate-200 p-4">
                           {" "}
              <div className="flex items-center gap-2">
                                <Search size={15} className="text-slate-400" /> 
                             {" "}
                <h2 className="text-sm font-bold text-slate-900">
                                    Find patient                {" "}
                </h2>
                             {" "}
              </div>
                           {" "}
              <div className="relative mt-3">
                               {" "}
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, patient number or phone"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-300 focus:bg-white"
                />
                             {" "}
              </div>
                         {" "}
            </div>
                       {" "}
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                           {" "}
              {loadingPatients ? (
                <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs text-slate-400">
                                   {" "}
                  <Loader2 size={15} className="animate-spin" /> Loading        
                            patients...                {" "}
                </div>
              ) : patients.length === 0 ? (
                <div className="px-5 py-12 text-center text-xs text-slate-400">
                                    No active patients found.              
                   {" "}
                </div>
              ) : (
                patients.map((patient) => {
                  const active = selectedPatient?._id === patient._id;

                  const age = ageFromDob(patient.dateOfBirth);

                  return (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => void selectPatient(patient)}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                                           {" "}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                                               {" "}
                        {(patient.firstName?.[0] || "P").toUpperCase()}         
                                     {" "}
                        {(patient.lastName?.[0] || "").toUpperCase()}           
                                 {" "}
                      </div>
                                           {" "}
                      <div className="min-w-0 flex-1">
                                               {" "}
                        <div className="truncate text-xs font-bold text-slate-900">
                                                    {fullName(patient)}         
                                       {" "}
                        </div>
                                               {" "}
                        <div className="mt-1 truncate text-[10px] text-slate-400">
                                                   {" "}
                          {patient.patientNumber || "No number"}               
                                    {age !== null ? ` · ${age} yrs` : ""}       
                                           {" "}
                          {patient.phone ? ` · ${patient.phone}` : ""}         
                                       {" "}
                        </div>
                                             {" "}
                      </div>
                                           {" "}
                      <ChevronRight
                        size={14}
                        className={active ? "text-blue-500" : "text-slate-300"}
                      />
                                         {" "}
                    </button>
                  );
                })
              )}
                         {" "}
            </div>
                     {" "}
          </aside>
                   {" "}
          <main className="min-w-0 space-y-5">
                       {" "}
            {!selectedPatient ? (
              <EmptyWorkspace />
            ) : (
              <>
                               {" "}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                   {" "}
                  <div className="bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 sm:p-6">
                                       {" "}
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                           {" "}
                      <div className="flex items-center gap-4">
                                               {" "}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                                                   {" "}
                          {(
                            selectedPatient.firstName?.[0] || "P"
                          ).toUpperCase()}
                                                   {" "}
                          {(selectedPatient.lastName?.[0] || "").toUpperCase()} 
                                               {" "}
                        </div>
                                               {" "}
                        <div>
                                                   {" "}
                          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                                                        Selected patient        
                                             {" "}
                          </div>
                                                   {" "}
                          <h2 className="mt-1 text-xl font-bold text-slate-950">
                                                       {" "}
                            {fullName(selectedPatient)}                       
                             {" "}
                          </h2>
                                                   {" "}
                          <div className="mt-1 text-xs text-slate-500">
                                                       {" "}
                            {selectedPatient.patientNumber ||
                              "No patient number"}{" "}
                                                        ·{" "}
                            {ageFromDob(selectedPatient.dateOfBirth) ?? "—"}    
                                                    years ·                    
                                   {" "}
                            {label(
                              selectedPatient.gender || "Gender not recorded",
                            )}
                                                     {" "}
                          </div>
                                                 {" "}
                        </div>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="flex flex-wrap gap-2">
                                               {" "}
                        <button
                          type="button"
                          onClick={startConsultation}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                        >
                                                    <ClipboardPlus size={14} />{" "}
                          Start consultation                        {" "}
                        </button>
                                               {" "}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/patients/${selectedPatient._id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                                                    <Eye size={14} /> Patient
                          record                        {" "}
                        </button>
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-4">
                                       {" "}
                    <Summary
                      label="Consultations"
                      value={consultations.length}
                    />
                                       {" "}
                    <Summary
                      label="Comprehensive"
                      value={
                        consultations.filter(
                          (x) => x.consultationType === "comprehensive",
                        ).length
                      }
                    />
                                       {" "}
                    <Summary
                      label="Specialized"
                      value={
                        consultations.filter(
                          (x) => x.consultationType === "specialized",
                        ).length
                      }
                    />
                                       {" "}
                    <Summary
                      label="Latest visit"
                      value={formatDate(consultations[0]?.consultationDate)}
                    />
                                     {" "}
                  </div>
                                 {" "}
                </section>
                               {" "}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                   {" "}
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                       {" "}
                    <div>
                                           {" "}
                      <div className="flex items-center gap-2">
                                               {" "}
                        <History size={15} className="text-blue-600" />         
                                     {" "}
                        <h2 className="text-sm font-bold text-slate-900">
                                                    Consultation history        
                                         {" "}
                        </h2>
                                             {" "}
                      </div>
                                           {" "}
                      <p className="mt-1 text-[10px] text-slate-400">
                                                Select any previous visit to
                        review the complete                         clinical
                        record.                      {" "}
                      </p>
                                         {" "}
                    </div>
                                       {" "}
                    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                                           {" "}
                      {[
                        ["all", "All"],

                        ["comprehensive", "Comprehensive"],

                        ["short_consult", "Short"],

                        ["specialized", "Specialized"],
                      ].map(([value, text]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setHistoryFilter(value)}
                          className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold ${historyFilter === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                        >
                                                    {text}                     
                           {" "}
                        </button>
                      ))}
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="p-5">
                                       {" "}
                    {loadingHistory ? (
                      <div className="flex justify-center py-12 text-xs text-slate-400">
                                               {" "}
                        <Loader2 size={16} className="mr-2 animate-spin" />    
                                            Loading history...                  
                           {" "}
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center text-xs text-slate-400">
                                                No consultations in this
                        category.                      {" "}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                               {" "}
                        {filteredHistory.map((item, index) => (
                          <button
                            key={item._id || index}
                            type="button"
                            onClick={() => void openConsultation(item)}
                            className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                          >
                                                       {" "}
                            <div className="flex items-start justify-between gap-3">
                                                           {" "}
                              <div className="text-xs font-bold text-slate-900">
                                                               {" "}
                                {formatDate(item.consultationDate)}             
                                               {" "}
                              </div>
                                                           {" "}
                              <ChevronRight
                                size={14}
                                className="text-slate-300 group-hover:text-blue-500"
                              />
                                                         {" "}
                            </div>
                                                       {" "}
                            <div
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(consultationTone(item))}`}
                            >
                                                           {" "}
                              {consultationLabel(item)}                         
                               {" "}
                            </div>
                                                       {" "}
                            <div className="mt-3 space-y-1 text-[10px] text-slate-400">
                                                           {" "}
                              <div>
                                                                Status:        
                                                       {" "}
                                <span className="font-semibold text-slate-600">
                                                                   {" "}
                                  {label(item.status || "completed")}           
                                                     {" "}
                                </span>
                                                             {" "}
                              </div>
                                                           {" "}
                              <div>
                                                                Clinician:      
                                                         {" "}
                                <span className="font-semibold text-slate-600">
                                                                   {" "}
                                  {item.optometristId
                                    ? fullName(item.optometristId)
                                    : "Clinical team"}
                                                                 {" "}
                                </span>
                                                             {" "}
                              </div>
                                                         {" "}
                            </div>
                                                     {" "}
                          </button>
                        ))}
                                             {" "}
                      </div>
                    )}
                                     {" "}
                  </div>
                                 {" "}
                </section>
                               {" "}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                   {" "}
                  <div className="border-b border-slate-200 px-5 py-4">
                                       {" "}
                    <div className="flex items-center gap-2">
                                           {" "}
                      <Stethoscope size={15} className="text-violet-600" />     
                                     {" "}
                      <h2 className="text-sm font-bold text-slate-900">
                                                Specialist assessments          
                                   {" "}
                      </h2>
                                         {" "}
                    </div>
                                       {" "}
                    <p className="mt-1 text-[10px] text-slate-400">
                                            Specialist assessments become
                      available after a completed                      
                      Comprehensive Consultation.                    {" "}
                    </p>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="grid gap-3 p-5 md:grid-cols-3">
                                       {" "}
                    <SpecialistCard
                      title="Binocular Vision"
                      description="Detailed binocular, sensory, motor and accommodative evaluation."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("binocular_vision")}
                    />
                                       {" "}
                    <SpecialistCard
                      title="Contact Lens"
                      description="Contact lens assessment, fitting and clinical evaluation."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("contact_lenses")}
                    />
                                       {" "}
                    <SpecialistCard
                      title="Low Vision"
                      description="Functional vision assessment and low-vision management."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("low_vision")}
                    />
                                     {" "}
                  </div>
                                 {" "}
                </section>
                             {" "}
              </>
            )}
                     {" "}
          </main>
                 {" "}
        </section>
             {" "}
      </div>
           {" "}
      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingRecord}
          onClose={() => setSelectedConsultation(null)}
        />
      )}
         {" "}
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <section className="flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
           {" "}
      <div className="max-w-sm">
               {" "}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <UserRound size={25} />       {" "}
        </div>
               {" "}
        <h2 className="mt-4 text-lg font-bold text-slate-900">
                    Select a patient        {" "}
        </h2>
               {" "}
        <p className="mt-2 text-xs leading-5 text-slate-400">
                    Choose a patient from the clinical directory to review their
                    consultation history and start the next clinical visit.    
             {" "}
        </p>
             {" "}
      </div>
         {" "}
    </section>
  );
}

function Summary({ label: title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
           {" "}
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {title}     {" "}
      </div>
            <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
         {" "}
    </div>
  );
}

function SpecialistCard({ title, description, enabled, onClick }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
           {" "}
      <div className="flex items-center justify-between">
               {" "}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Stethoscope size={16} />       {" "}
        </div>
               {" "}
        <ChevronRight
          size={15}
          className="text-slate-300 group-hover:text-violet-500"
        />
             {" "}
      </div>
            <div className="mt-3 text-xs font-bold text-slate-900">{title}</div>
           {" "}
      <p className="mt-1 text-[10px] leading-5 text-slate-400">{description}</p>
           {" "}
      <div
        className={`mt-3 text-[9px] font-bold ${enabled ? "text-emerald-600" : "text-slate-400"}`}
      >
                {enabled ? "Available" : "Complete Comprehensive first"}   
         {" "}
      </div>
         {" "}
    </button>
  );
}

const MODAL_FIELD_LABELS = {
  visualAcuity: "Visual Acuity",
  right: "Right Eye (OD)",
  left: "Left Eye (OS)",
  od: "Right Eye (OD)",
  os: "Left Eye (OS)",
  ou: "Both Eyes (OU)",
  va: "Visual Acuity",
  nearVa: "Near Visual Acuity",
  distance: "Distance",
  near: "Near",
  unaided: "Unaided",
  aided: "Aided",
  pinhole: "Pinhole",
  sphere: "Sphere",
  cylinder: "Cylinder",
  axis: "Axis",
  add: "Add",
  inter: "Intermediate",
  prism: "Prism",
  base: "Base",
  pd: "Pupillary Distance (PD)",
  npc: "Near Point of Convergence (NPC)",
  npa: "Near Point of Accommodation (NPA)",
  aa: "Amplitude of Accommodation (AA)",
  nra: "Negative Relative Accommodation (NRA)",
  pra: "Positive Relative Accommodation (PRA)",
  mem: "MEM Retinoscopy",
  cdRatio: "Cup-to-Disc Ratio",
  refractionNotes: "Refraction Notes",
  refractionNote: "Refraction Notes",
  recallDue: "Recall Due Date",
  recallLetter: "Recall Letter",
  patientInstructions: "Patient Instructions",
  internalNotes: "Internal Notes",
  clinicalNotes: "Clinical Notes",
  chiefComplaints: "Chief Complaints",
  symptoms: "Symptoms / Complaints",
  medication: "Medication",
  allergy: "Allergies",
  pupils: "Pupillary Findings",
  slitLamp: "Slit Lamp Examination",
  fundus: "Fundus Examination",
  ophthalmoscopy: "Ophthalmoscopy",
  biomicroscopy: "Biomicroscopy",
  visualField: "Visual Field",
  colourVision: "Colour Vision",
  otherTests: "Other Tests",
  binocularVision: "Binocular Vision",
  lowVision: "Low Vision",
  contactLens: "Contact Lens",
  contactLenses: "Contact Lenses",
  dispensing: "Dispensing Details",
  diagnosis: "Diagnosis",
  impression: "Clinical Impression",
  advice: "Advice / Management Plan",
  therapeutics: "Therapeutics",
  reasonForVisit: "Reason for Visit",
  medicalHistory: "Medical History",
  ocularHistory: "Ocular History",
  familyHistory: "Family History",
  consultationDate: "Consultation Date",
  consultationType: "Consultation Type",
  optometristId: "Clinician",
  recall: "Recall Details",
  notes: "Additional Notes",
};

const parseModalValue = (value) => {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if (
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]"))
  ) {
    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }
  return value;
};

const isBlankModalValue = (value) => {
  const parsed = parseModalValue(value);
  if (parsed === null || parsed === undefined) return true;
  if (typeof parsed === "string") return parsed.trim() === "";
  if (Array.isArray(parsed))
    return parsed.length === 0 || parsed.every(isBlankModalValue);
  if (typeof parsed === "object") {
    const entries = Object.entries(parsed).filter(
      ([key]) => key !== "_id" && key !== "__v",
    );
    return (
      entries.length === 0 ||
      entries.every(([, item]) => isBlankModalValue(item))
    );
  }
  return false;
};

const firstRecordedValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && !isBlankModalValue(value),
  );

const modalFieldLabel = (key = "") =>
  MODAL_FIELD_LABELS[key] ||
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();

function ConsultationModal({ consultation, loading, onClose }) {
  const consultationType = consultationLabel(consultation);
  const prescriptions = [
    ["Previous Prescription", consultation?.previousRx],
    ["Objective Prescription", consultation?.objectiveRx],
    ["Subjective Prescription", consultation?.subjectiveRx],
    ["Final Prescription", consultation?.finalRx],
    ["Given Prescription", consultation?.givenRx],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${consultationType} clinical record`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">
              Patient clinical history
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                {consultationType}
              </h2>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                {label(consultation?.status || "completed")}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {formatDateTime(
                consultation?.consultationDate || consultation?.createdAt,
              )}
              {consultation?.optometristId &&
              typeof consultation.optometristId === "object"
                ? ` · ${fullName(consultation.optometristId)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close consultation history"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-10 text-xs text-slate-500">
              <Loader2 size={15} className="animate-spin" /> Loading complete
              consultation record...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ModalMeta label="Consultation type" value={consultationType} />
                <ModalMeta
                  label="Visit date"
                  value={formatDate(consultation?.consultationDate)}
                />
                <ModalMeta
                  label="Clinician"
                  value={
                    fullName(consultation?.optometristId) || "Clinical team"
                  }
                />
                <ModalMeta
                  label="Recall due"
                  value={formatDate(
                    consultation?.recallDue ||
                      consultation?.recall?.due ||
                      consultation?.recall?.date,
                  )}
                />
              </div>

              <ClinicalSection
                title="Consultation information"
                fields={[
                  [
                    "Reason for visit",
                    firstRecordedValue(
                      consultation?.reasonForVisit,
                      consultation?.reason,
                    ),
                  ],
                  [
                    "Symptoms / complaints",
                    firstRecordedValue(
                      consultation?.symptoms,
                      consultation?.chiefComplaints,
                    ),
                  ],
                  ["Medical history", consultation?.medicalHistory],
                  ["Ocular history", consultation?.ocularHistory],
                  ["Family history", consultation?.familyHistory],
                  ["Medication", consultation?.medication],
                  ["Allergies", consultation?.allergy],
                  ["Pupillary findings", consultation?.pupils],
                ]}
              />

              <ClinicalSection title="Visual acuity" always>
                {isBlankModalValue(consultation?.visualAcuity) ? (
                  <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-400">
                    No visual acuity values recorded for this consultation.
                  </p>
                ) : (
                  <VisualAcuityTable value={consultation.visualAcuity} />
                )}
              </ClinicalSection>

              <ClinicalSection title="Refraction & prescription">
                {prescriptions.some(
                  ([, value]) => !isBlankModalValue(value),
                ) ? (
                  <div className="space-y-2">
                    {prescriptions.map(([title, value]) => (
                      <PrescriptionHistoryTable
                        key={title}
                        title={title}
                        value={value}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-400">
                    No prescription stages recorded.
                  </p>
                )}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <ClinicalField
                    label="Pupillary distance (PD)"
                    value={consultation?.pd}
                  />
                  <ClinicalField
                    label="Refraction notes"
                    value={firstRecordedValue(
                      consultation?.refractionNotes,
                      consultation?.refractionNote,
                    )}
                  />
                </div>
              </ClinicalSection>

              <ClinicalSection
                title="Clinical management & tests"
                fields={[
                  ["Slit lamp examination", consultation?.slitLamp],
                  ["Fundus examination", consultation?.fundus],
                  ["Ophthalmoscopy", consultation?.ophthalmoscopy],
                  ["Biomicroscopy", consultation?.biomicroscopy],
                  ["Visual field", consultation?.visualField],
                  ["Colour vision", consultation?.colourVision],
                  ["Other tests", consultation?.otherTests],
                ]}
              />

              <ClinicalSection
                title="Specialist assessments"
                fields={[
                  ["Binocular vision", consultation?.binocularVision],
                  ["Low vision", consultation?.lowVision],
                  [
                    "Contact lens",
                    firstRecordedValue(
                      consultation?.contactLens,
                      consultation?.contactLenses,
                    ),
                  ],
                  ["Dispensing details", consultation?.dispensing],
                ]}
              />

              <ClinicalSection
                title="Diagnosis & treatment"
                fields={[
                  [
                    "Diagnosis",
                    firstRecordedValue(
                      consultation?.diagnosis,
                      consultation?.impression,
                    ),
                  ],
                  ["Advice / management plan", consultation?.advice],
                  ["Therapeutics", consultation?.therapeutics],
                ]}
              />

              <ClinicalSection
                title="Clinical notes & recall"
                fields={[
                  ["Clinical notes", consultation?.clinicalNotes],
                  ["Patient instructions", consultation?.patientInstructions],
                  ["Internal notes", consultation?.internalNotes],
                  ["Additional notes", consultation?.notes],
                  ["Recall details", consultation?.recall],
                  ["Recall due date", consultation?.recallDue],
                  ["Recall letter", consultation?.recallLetter],
                ]}
              />

              <ClinicalSection
                title="Record information"
                fields={[
                  [
                    "Created",
                    consultation?.createdAt
                      ? formatDateTime(consultation.createdAt)
                      : "",
                  ],
                  [
                    "Last updated",
                    consultation?.updatedAt
                      ? formatDateTime(consultation.updatedAt)
                      : "",
                  ],
                ]}
              />
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5">
          <span className="text-[9px] text-slate-400">
            Clinical record · View only
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-700"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function ModalMeta({ label: title, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
        {title}
      </div>
      <div
        className="mt-1 truncate text-[10px] font-semibold text-slate-700"
        title={String(value ?? "")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function ClinicalSection({ title, fields, children, always = false }) {
  const populated = (fields || []).filter(
    ([, value]) => !isBlankModalValue(value),
  );
  if (!always && !children && populated.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="border-b border-slate-100 bg-slate-50 px-3 py-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-700">
          {title}
        </h3>
      </header>
      <div className="p-3">
        {children ||
          (populated.length ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {populated.map(([fieldLabel, value]) => (
                <ClinicalField
                  key={fieldLabel}
                  label={fieldLabel}
                  value={value}
                />
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">No details recorded.</p>
          ))}
      </div>
    </section>
  );
}

function ClinicalField({ label: title, value }) {
  if (isBlankModalValue(value)) return null;
  return (
    <div className="min-w-0 rounded-md border border-slate-100 bg-slate-50/70 px-2.5 py-2">
      <div className="mb-1 text-[8px] font-bold uppercase tracking-[.08em] text-slate-400">
        {title}
      </div>
      <ClinicalValue value={value} />
    </div>
  );
}

function VisualAcuityTable({ value }) {
  const acuity = parseModalValue(value) || {};
  const right = acuity.right || acuity.od || acuity.OD || {};
  const left = acuity.left || acuity.os || acuity.OS || {};
  const columns = [
    ["distance", "Distance"],
    ["near", "Near"],
    ["unaided", "Unaided"],
    ["aided", "Aided"],
    ["pinhole", "Pinhole"],
  ];
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-2.5 py-2">Eye</th>
              {columns.map(([, title]) => (
                <th key={title} className="px-2 py-2 text-center">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["OD", right, "text-blue-700"],
              ["OS", left, "text-rose-700"],
            ].map(([eye, row, tone]) => (
              <tr key={eye} className="border-b border-slate-100 last:border-0">
                <th className={`px-2.5 py-2 text-[10px] font-bold ${tone}`}>
                  {eye}
                </th>
                {columns.map(([key]) => (
                  <td
                    key={key}
                    className="px-2 py-2 text-center font-mono text-[10px] text-slate-700"
                  >
                    {firstRecordedValue(row?.[key], row?.[key.toUpperCase()]) ||
                      "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isBlankModalValue(acuity.notes) && (
        <ClinicalField label="Visual acuity notes" value={acuity.notes} />
      )}
      {!acuity.right && !acuity.left && !acuity.od && !acuity.os && (
        <ClinicalValue value={acuity} />
      )}
    </div>
  );
}

function PrescriptionHistoryTable({ title, value }) {
  if (isBlankModalValue(value)) return null;
  const prescription = parseModalValue(value) || {};
  const right = prescription.right || prescription.od || prescription.OD || {};
  const left = prescription.left || prescription.os || prescription.OS || {};
  const columns = [
    ["sphere", "SPH"],
    ["cylinder", "CYL"],
    ["axis", "AXIS"],
    ["va", "VA"],
    ["nearVa", "Near VA"],
    ["add", "ADD"],
    ["inter", "INTER"],
    ["prism", "PRISM"],
    ["base", "BASE"],
  ];
  const hasEyeValues = !isBlankModalValue(right) || !isBlankModalValue(left);
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold text-slate-700">
        {title}
      </div>
      {hasEyeValues &&
      (typeof right === "object" || typeof left === "object") ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-2.5 py-2">Eye</th>
                {columns.map(([, text]) => (
                  <th key={text} className="px-2 py-2 text-center">
                    {text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["OD", right, "text-blue-700"],
                ["OS", left, "text-rose-700"],
              ].map(([eye, row, tone]) => (
                <tr
                  key={eye}
                  className="border-b border-slate-100 last:border-0"
                >
                  <th className={`px-2.5 py-2 text-[9px] font-bold ${tone}`}>
                    {eye}
                  </th>
                  {columns.map(([key]) => (
                    <td
                      key={key}
                      className="px-2 py-2 text-center font-mono text-[9px] text-slate-700"
                    >
                      {firstRecordedValue(
                        row?.[key],
                        row?.[key.toUpperCase()],
                      ) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-2.5">
          <ClinicalValue value={prescription} />
        </div>
      )}
      {!isBlankModalValue(prescription.note) && (
        <div className="border-t border-slate-100 px-3 py-2">
          <ClinicalField label="Prescription notes" value={prescription.note} />
        </div>
      )}
    </div>
  );
}

function ClinicalValue({ value, depth = 0 }) {
  const parsed = parseModalValue(value);
  if (isBlankModalValue(parsed))
    return <span className="text-[10px] text-slate-300">—</span>;
  if (typeof parsed === "boolean")
    return (
      <span className="text-[10px] font-medium text-slate-700">
        {parsed ? "Yes" : "No"}
      </span>
    );
  if (typeof parsed === "string" || typeof parsed === "number")
    return (
      <span className="whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-700">
        {String(parsed)}
      </span>
    );
  if (depth > 6)
    return (
      <pre className="max-w-full whitespace-pre-wrap break-words text-[9px] leading-4 text-slate-600">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );

  if (Array.isArray(parsed)) {
    const values = parsed.filter((item) => !isBlankModalValue(item));
    if (!values.length)
      return <span className="text-[10px] text-slate-300">—</span>;
    return (
      <div className="space-y-1.5">
        {values.map((item, index) => {
          const title =
            item && typeof item === "object"
              ? item.name || item.title || item.testName || item.label
              : "";
          const content =
            item && typeof item === "object" && !Array.isArray(item)
              ? Object.fromEntries(
                  Object.entries(item).filter(
                    ([key]) =>
                      ![
                        "_id",
                        "__v",
                        "name",
                        "title",
                        "testName",
                        "label",
                      ].includes(key),
                  ),
                )
              : item;
          return (
            <div
              key={`${index}-${title || String(item)}`}
              className="rounded-md border border-slate-100 bg-white p-2"
            >
              {title && (
                <div className="mb-1 text-[9px] font-bold text-slate-700">
                  {title}
                </div>
              )}
              <ClinicalValue value={content} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }

  const entries = Object.entries(parsed).filter(
    ([key, item]) => !["_id", "__v"].includes(key) && !isBlankModalValue(item),
  );
  if (!entries.length)
    return <span className="text-[10px] text-slate-300">—</span>;
  const eyeKeys = new Set(["right", "left", "od", "os", "ou"]);
  const groupedByEye = entries.some(([key]) =>
    eyeKeys.has(String(key).toLowerCase()),
  );
  return (
    <dl
      className={`grid min-w-0 gap-1.5 ${groupedByEye ? "sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}
    >
      {entries.map(([key, item]) => {
        const nested = item !== null && typeof item === "object";
        return (
          <div
            key={key}
            className={`min-w-0 rounded-md border border-slate-100 bg-white px-2 py-1.5 ${nested ? "sm:col-span-2" : ""}`}
          >
            <dt className="mb-0.5 text-[8px] font-bold uppercase tracking-[.07em] text-slate-400">
              {modalFieldLabel(key)}
            </dt>
            <dd className="min-w-0">
              <ClinicalValue value={item} depth={depth + 1} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function toneClass(tone) {
  return tone === "blue"
    ? "bg-blue-50 text-blue-700"
    : tone === "violet"
      ? "bg-violet-50 text-violet-700"
      : "bg-amber-50 text-amber-700";
}
