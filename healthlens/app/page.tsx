"use client";
import { useState, useEffect } from "react";

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = "results" | "inputs" | "questions" | "evidence" | "data";
type DetailSheet = "med" | "lipid" | "methyl" | "hfe" | null;
type MarkerKey = keyof typeof MARKERS;
type Status = "low" | "optimal" | "borderline" | "high";
type DefaultValues = Record<MarkerKey, number>;
type OnboardingInput = "dna" | "blood" | "medication";

// ─── marker configs ───────────────────────────────────────────────────────────
const MARKERS = {
  apob: {
    name: "ApoB", unit: "mg/dL", optimalBelow: 80, borderlineBelow: 120, scale: 160,
    description: "Atherosclerotic risk marker", source: "Blood panel · May 2026",
  },
  ldl: {
    name: "LDL-C", unit: "mg/dL", optimalBelow: 100, borderlineBelow: 160, scale: 210,
    description: "Low-density lipoprotein", source: "Blood panel · May 2026",
  },
  hscrp: {
    name: "hs-CRP", unit: "mg/L", optimalBelow: 1.0, borderlineBelow: 3.0, scale: 7,
    description: "Systemic inflammation marker", source: "Blood panel · May 2026",
  },
  homocysteine: {
    name: "Homocysteine", unit: "µmol/L", optimalBelow: 15, borderlineBelow: 20, scale: 28,
    description: "Methylation pathway marker", source: "Blood panel · May 2026", lowBelow: 5,
  },
} as const;

const DEFAULT_VALUES: DefaultValues = { apob: 125, ldl: 155, hscrp: 4.2, homocysteine: 7.8 };
const PREV_PANEL = { apob: 118, ldl: 142, hscrp: 3.8 };
const PREV_PANEL_LABEL = "Nov 2025";

// ─── pure functions ───────────────────────────────────────────────────────────
function getStatus(key: MarkerKey, value: number): Status {
  const m = MARKERS[key];
  if ("lowBelow" in m && value < (m as typeof MARKERS.homocysteine).lowBelow) return "low";
  if (value < m.optimalBelow) return "optimal";
  if (value < m.borderlineBelow) return "borderline";
  return "high";
}

function getStatusLabel(status: Status, key: MarkerKey): string {
  if (key === "homocysteine") {
    if (status === "low") return "Below normal";
    if (status === "optimal") return "Normal";
    if (status === "borderline") return "Mildly elevated";
    return "Elevated";
  }
  if (status === "optimal") return "Optimal";
  if (status === "borderline") return key === "ldl" ? "Borderline high" : "Borderline";
  return "High";
}

function statusColors(status: Status) {
  switch (status) {
    case "optimal":    return { value: "text-[#1c1c1e]",  badge: "bg-[#34c75920] text-[#1d8338]" };
    case "borderline": return { value: "text-[#ff9500]",  badge: "bg-[#ff950020] text-[#b36200]" };
    case "high":       return { value: "text-[#ff3b30]",  badge: "bg-[#ff3b3020] text-[#d32f2f]" };
    case "low":        return { value: "text-[#007aff]",  badge: "bg-[#007aff20] text-[#0055b3]" };
  }
}

function lipidSeverity(vals: DefaultValues): "monitor" | "watch" {
  const statuses = [getStatus("apob", vals.apob), getStatus("ldl", vals.ldl), getStatus("hscrp", vals.hscrp)];
  if (statuses.some(s => s === "high")) return "monitor";
  return "watch";
}

// ─── segmented bar ────────────────────────────────────────────────────────────
function SegmentedBar({ value, markerKey }: { value: number; markerKey: MarkerKey }) {
  const cfg = MARKERS[markerKey];
  const scale   = Math.max(cfg.scale, value * 1.1);
  const optPct  = (cfg.optimalBelow / scale) * 100;
  const borderW = ((cfg.borderlineBelow - cfg.optimalBelow) / scale) * 100;
  const highW   = 100 - optPct - borderW;
  const dotPct  = Math.min((value / scale) * 100, 97);
  const status  = getStatus(markerKey, value);
  const dotColor = status === "high" ? "#ff3b30" : status === "borderline" ? "#ff9500" : "#34c759";
  return (
    <div className="relative mt-1.5">
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-[#34c75950]" style={{ width: `${optPct}%` }} />
        <div className="bg-[#ff950050]" style={{ width: `${borderW}%` }} />
        <div className="bg-[#ff3b3050]" style={{ width: `${highW}%` }} />
      </div>
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: `${dotPct}%`, backgroundColor: dotColor }}
      />
    </div>
  );
}

// ─── chevron ──────────────────────────────────────────────────────────────────
function ChevronIcon({ open, light = false }: { open: boolean; light?: boolean }) {
  return (
    <svg className={`mt-1.5 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${light ? "text-white/60" : "text-[#c7c7cc]"}`} viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── trend row ────────────────────────────────────────────────────────────────
function TrendRow({ label, prev, current, unit }: { label: string; prev: number; current: number; unit: string }) {
  const delta = current - prev;
  const improved = delta < 0;
  const unchanged = delta === 0;
  const color = unchanged ? "text-[#8e8e93]" : improved ? "text-[#34c759]" : "text-[#ff3b30]";
  const arrow = unchanged ? "→" : improved ? "↓" : "↑";
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-semibold text-[#1c1c1e]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8e8e93] tabular-nums">{prev}</span>
        <span className="text-[10px] text-[#c7c7cc]">→</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{current}</span>
        <span className="text-xs text-[#8e8e93]">{unit}</span>
        <span className={`text-[11px] font-semibold tabular-nums ${color}`}>{arrow}{unchanged ? "" : ` ${Math.abs(delta).toFixed(1)}`}</span>
      </div>
    </div>
  );
}

// ─── small display atoms ──────────────────────────────────────────────────────
function DataUsedRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="mt-0.5 shrink-0 text-[10px] font-bold text-[#34c759]">✓</span>
      <p className="text-xs leading-5 text-[#3a3a3c]">{text}</p>
    </div>
  );
}

function EvidenceRow({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="text-xs font-bold tabular-nums text-[#c7c7cc]">{n}</span>
      <p className="text-xs leading-5 text-[#3a3a3c]">{text}</p>
    </div>
  );
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <span className="shrink-0 text-sm font-semibold text-[#1c1c1e]">{label}</span>
      <span className="text-right text-xs text-[#8e8e93]">{value}</span>
    </div>
  );
}

function GenotypeDeltaRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 shrink-0 text-[10px] font-bold text-[#007aff]">→</span>
      <p className="text-[11px] leading-5 text-[#3a3a3c]">{text}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">{children}</p>;
}

function Tag({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>;
}

function CardFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="w-[58px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#c7c7cc]">{label}</span>
      <span className="text-[11px] leading-4 text-[#3a3a3c]">{value}</span>
    </div>
  );
}

// ─── result card ──────────────────────────────────────────────────────────────
function ResultCard({
  highlighted, statusLabel, statusHeaderBg, statusTagClass,
  dnaBloodLabel, domain, title, summary, dataUsed, question, evidence,
  isAdded, onViewDetails, onAddToSummary, children,
}: {
  highlighted?: boolean;
  statusLabel: string;
  statusHeaderBg: string;
  statusTagClass: string;
  dnaBloodLabel: string;
  domain: string;
  title: string;
  summary: string;
  dataUsed: string;
  question: string;
  evidence: string;
  isAdded: boolean;
  onViewDetails: () => void;
  onAddToSummary: () => void;
  children?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {highlighted ? (
        <div className={`${statusHeaderBg} px-4 pb-3 pt-4`}>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <Tag label={statusLabel} className="bg-white/20 text-white" />
            <Tag label={dnaBloodLabel} className="bg-white/15 text-white/90" />
            <Tag label={domain} className="bg-white/15 text-white/80" />
          </div>
          <h3 className="text-[16px] font-bold leading-snug text-white">{title}</h3>
          <p className="mt-1 text-xs text-white/75">{summary}</p>
        </div>
      ) : (
        <div className="px-4 pb-3 pt-4">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <Tag label={statusLabel} className={statusTagClass} />
            <Tag label={dnaBloodLabel} className="bg-[#f0ede8] text-[#8e8e93]" />
            <Tag label={domain} className="bg-[#f0ede8] text-[#8e8e93]" />
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-[#1c1c1e]">{title}</h3>
          <p className="mt-1 text-xs text-[#8e8e93]">{summary}</p>
        </div>
      )}
      <div className="border-t border-[#f0ede8] px-4 py-2.5">
        <CardFactRow label="Data" value={dataUsed} />
        <CardFactRow label="Ask" value={question} />
        <CardFactRow label="Source" value={evidence} />
      </div>
      {children && <div className="border-t border-[#f0ede8] px-4 py-2.5">{children}</div>}
      <div className="flex gap-2 border-t border-[#f0ede8] px-4 py-3">
        <button
          onClick={onViewDetails}
          className="flex-1 rounded-xl bg-[#f5f4f0] py-2 text-xs font-semibold text-[#1c1c1e]"
        >
          View details
        </button>
        <button
          onClick={onAddToSummary}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
            isAdded ? "bg-[#34c75920] text-[#1d8338]" : "bg-[#007aff15] text-[#007aff]"
          }`}
        >
          {isAdded ? "✓ In summary" : "Add to summary"}
        </button>
      </div>
    </article>
  );
}

// ─── detail sheet shell ───────────────────────────────────────────────────────
function DetailSheetModal({
  title, statusLabel, statusTagClass, dnaBloodLabel, domain,
  isAdded, onAddToSummary, onClose, children,
}: {
  title: string;
  statusLabel: string;
  statusTagClass: string;
  dnaBloodLabel: string;
  domain: string;
  isAdded: boolean;
  onAddToSummary: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white px-5 pt-5 pb-3 border-b border-[#f0ede8]">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Tag label={statusLabel} className={statusTagClass} />
                <Tag label={dnaBloodLabel} className="bg-[#007aff15] text-[#0055b3]" />
                <Tag label={domain} className="bg-[#f0ede8] text-[#8e8e93]" />
              </div>
              <h2 className="text-[17px] font-bold leading-snug text-[#1c1c1e]">{title}</h2>
            </div>
            <button onClick={onClose} className="shrink-0 text-sm font-semibold text-[#007aff]">Done</button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-5 text-sm text-[#3a3a3c]">
          {children}
        </div>
        <div className="border-t border-[#e5e5ea] px-5 py-4 grid grid-cols-2 gap-2 pb-8">
          <button
            onClick={onAddToSummary}
            className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
              isAdded ? "bg-[#34c75920] text-[#1d8338]" : "bg-[#007aff] text-white"
            }`}
          >
            {isAdded ? "✓ In summary" : "Add to summary"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-[#d1d1d6] py-3 text-sm font-semibold text-[#1c1c1e]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── doctor summary sheet ─────────────────────────────────────────────────────
function DoctorSummarySheet({
  vals, panelLabel, hfeWithGenotype, checkedQuestions, qDiscussed, clinicianNote, reminderSet, dnaDeleted, bloodDeleted, onClose,
}: {
  vals: DefaultValues;
  panelLabel: string;
  hfeWithGenotype: boolean;
  checkedQuestions: Array<{ id: string; text: string; tag: string }>;
  qDiscussed: Record<string, boolean>;
  clinicianNote: string;
  reminderSet: boolean;
  dnaDeleted: boolean;
  bloodDeleted: boolean;
  onClose: () => void;
}) {
  const discussedQuestions = checkedQuestions.filter(q => qDiscussed[q.id]);

  function copyToClipboard() {
    const lines = [
      "Patient-prepared discussion summary — HealthLens prototype",
      "",
      `Generated from: ${dnaDeleted ? "DNA file removed" : "1 DNA file (CYP2C19 *2/*2)"} + ${bloodDeleted ? "blood panel removed" : `1 blood panel (${panelLabel})`}`,
      "Medication on file: Clopidogrel",
      "",
      ...(bloodDeleted ? ["Blood markers: blood panel removed from this prototype session"] : [
        "Blood markers:",
        `  ApoB: ${vals.apob} mg/dL`,
        `  LDL-C: ${vals.ldl} mg/dL`,
        `  hs-CRP: ${vals.hscrp} mg/L`,
        `  Homocysteine: ${vals.homocysteine} µmol/L`,
        ...(hfeWithGenotype ? ["  HFE C282Y/C282Y · Ferritin 420 µg/L · TSAT 58% (worked example)"] : []),
      ]),
      "",
      "Questions to bring:",
      ...(checkedQuestions.length ? checkedQuestions.map((q, i) => `  ${i + 1}. ${q.text}`) : ["  None selected"]),
      "",
      "Discussed during appointment:",
      ...(discussedQuestions.length ? discussedQuestions.map((q, i) => `  ${i + 1}. ${q.text}`) : ["  None marked yet"]),
      ...(clinicianNote.trim() ? ["", "Clinician note:", `  ${clinicianNote.trim()}`] : []),
      "",
      `Follow-up reminder: ${reminderSet ? "set" : "not set"}`,
      "",
      "Do not start, stop, or change medication based on this summary alone.",
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-5 pb-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Doctor summary</h2>
          <button onClick={onClose} className="text-sm font-semibold text-[#007aff]">Done</button>
        </div>
        <div className="space-y-4 text-sm text-[#3a3a3c]">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Generated from</p>
            <p>{dnaDeleted ? "DNA file removed from this prototype session" : "1 DNA file · CYP2C19 *2/*2"}</p>
            <p>{bloodDeleted ? "Blood panel removed from this prototype session" : `1 blood panel · ${panelLabel}`}</p>
            <p>Medication: Clopidogrel</p>
          </div>
          {!dnaDeleted && (
            <div className="border-t border-[#e5e5ea] pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Medication note</p>
              <p>CYP2C19 *2/*2 predicts substantially reduced clopidogrel activation. Please review whether current therapy is appropriate given this result.</p>
            </div>
          )}
          {!bloodDeleted && (
            <div className="border-t border-[#e5e5ea] pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Blood markers</p>
              <p>ApoB: {vals.apob} mg/dL · LDL-C: {vals.ldl} mg/dL</p>
              <p>hs-CRP: {vals.hscrp} mg/L · Homocysteine: {vals.homocysteine} µmol/L</p>
              {hfeWithGenotype && <p className="mt-1">HFE C282Y/C282Y · Ferritin 420 µg/L · TSAT 58% (worked example)</p>}
            </div>
          )}
          {checkedQuestions.length > 0 && (
            <div className="border-t border-[#e5e5ea] pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions to bring</p>
              {checkedQuestions.map((q, i) => (
                <p key={q.id} className="mt-1 leading-5">{i + 1}. {q.text}</p>
              ))}
            </div>
          )}
          {discussedQuestions.length > 0 && (
            <div className="border-t border-[#e5e5ea] pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Discussed during appointment</p>
              {discussedQuestions.map((q, i) => (
                <p key={q.id} className="mt-1 leading-5">✓ {i + 1}. {q.text}</p>
              ))}
            </div>
          )}
          {(clinicianNote.trim() || reminderSet) && (
            <div className="border-t border-[#e5e5ea] pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Follow-up</p>
              {clinicianNote.trim() && <p className="leading-5">Clinician note: {clinicianNote.trim()}</p>}
              <p className="mt-1 text-xs text-[#8e8e93]">Retest reminder: {reminderSet ? "set ✓" : "not set"}</p>
            </div>
          )}
          <div className="border-t border-[#e5e5ea] pt-3">
            <p className="text-[11px] text-[#8e8e93]">Do not start, stop, or change medication based on this summary alone.</p>
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          className="mt-5 w-full rounded-2xl bg-[#1c1c1e] py-3 text-sm font-semibold text-white"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function Home() {

  /* ── state ── */
  const [activeTab, setActiveTab]         = useState<Tab>("results");
  const [detailSheet, setDetailSheet]     = useState<DetailSheet>(null);
  const [vals, setVals]                   = useState<DefaultValues>(DEFAULT_VALUES);
  const [editingKey, setEditingKey]       = useState<MarkerKey | null>(null);
  const [editDraft, setEditDraft]         = useState("");
  const [showSummary, setShowSummary]     = useState(false);
  const [panelLabel, setPanelLabel]       = useState("May 2026");
  const [panelUploaded, setPanelUploaded] = useState(false);
  const [b12, setB12]                     = useState("520");
  const [folate, setFolate]               = useState("12.4");
  const [showExtraMarkers, setShowExtraMarkers] = useState(false);
  const [hfeWithGenotype, setHfeWithGenotype]   = useState(false);
  const [showHfeTrace, setShowHfeTrace]         = useState(false);
  const [activeChip, setActiveChip]             = useState("All");
  const [openEvidence, setOpenEvidence]         = useState<string | null>(null);
  const [dataCleared, setDataCleared]           = useState(false);
  const [dnaDeleted, setDnaDeleted]             = useState(false);
  const [bloodDeleted, setBloodDeleted]         = useState(false);
  const [qChecked, setQChecked] = useState<Record<string, boolean>>({
    q1: true, q2: true, q3: false, q4: false, q5: false, q6: false,
  });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [hasDemoData, setHasDemoData]         = useState(false);
  const [demoInputs, setDemoInputs] = useState<Record<OnboardingInput, boolean>>({
    dna: false,
    blood: false,
    medication: false,
  });
  const [qDiscussed, setQDiscussed]           = useState<Record<string, boolean>>({});
  const [clinicianNote, setClinicianNote]     = useState("");
  const [reminderSet, setReminderSet]         = useState(false);

  /* ── URL param: open summary on ?summary=1 ── */
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("summary=1")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSummary(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("summary");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  /* ── helpers ── */
  function commitEdit() {
    const n = parseFloat(editDraft);
    if (!isNaN(n) && n > 0 && editingKey) setVals(prev => ({ ...prev, [editingKey]: n }));
    setEditingKey(null);
    setEditDraft("");
  }

  function uploadNewerPanel() {
    setVals({ apob: 112, ldl: 138, hscrp: 2.2, homocysteine: 8.1 });
    setPanelLabel("June 2026");
    setPanelUploaded(true);
    setBloodDeleted(false);
  }

  function resetDemoSession() {
    setVals(DEFAULT_VALUES);
    setPanelLabel("May 2026");
    setPanelUploaded(false);
    setB12("520");
    setFolate("12.4");
    setShowExtraMarkers(false);
    setHfeWithGenotype(false);
    setShowHfeTrace(false);
    setActiveChip("All");
    setOpenEvidence(null);
    setQChecked({ q1: true, q2: true, q3: false, q4: false, q5: false, q6: false });
    setQDiscussed({});
    setClinicianNote("");
    setReminderSet(false);
    setDnaDeleted(true);
    setBloodDeleted(true);
    setDataCleared(true);
    setHasDemoData(false);
    setDemoInputs({ dna: false, blood: false, medication: false });
    setActiveTab("results");
    setDetailSheet(null);
    setShowSummary(false);
  }

  function loadDemoData() {
    setVals(DEFAULT_VALUES);
    setPanelLabel("May 2026");
    setPanelUploaded(false);
    setDnaDeleted(false);
    setBloodDeleted(false);
    setDataCleared(false);
    setHasDemoData(true);
    setActiveTab("results");
  }

  /* ── computed ── */
  const mthfrStatus: "monitor" | "reassuring" =
    vals.homocysteine >= MARKERS.homocysteine.optimalBelow ? "monitor" : "reassuring";
  const lipidSev  = lipidSeverity(vals);
  const nonOptimalCount = (["apob", "ldl", "hscrp"] as MarkerKey[]).filter(k => getStatus(k, vals[k]) !== "optimal").length;
  const dnaReady = !dnaDeleted;
  const bloodReady = !bloodDeleted;
  const medicationReady = true;
  const readySourceCount = [dnaReady, bloodReady, medicationReady].filter(Boolean).length;
  const onboardingComplete = demoInputs.dna && demoInputs.blood && demoInputs.medication;

  /* ── questions list (depends on state, computed inline) ── */
  const questions = [
    { id: "q1", text: "Is clopidogrel still appropriate given my CYP2C19 *2/*2 result?",            tag: "Medication",   card: "med"   },
    { id: "q2", text: "Are there medication options that fit my CYP2C19 result better?",             tag: "Medication",   card: "med"   },
    { id: "q3", text: `My ApoB is ${vals.apob} mg/dL — should this trigger a lipid review?`,        tag: "Blood",        card: "lipid" },
    { id: "q4", text: "Is my hs-CRP elevation worth investigating further, or is it incidental?",    tag: "Blood",        card: "lipid" },
    { id: "q5", text: "MTHFR is in my DNA — does this matter if my homocysteine is normal?",        tag: "DNA",          card: "methyl"},
    {
      id: "q6",
      text: hfeWithGenotype
        ? "My iron markers are elevated and HFE C282Y/C282Y is in my data — is an HFE-related iron overload evaluation appropriate?"
        : "These iron markers are elevated — should I repeat fasting iron studies and check for inflammation or liver involvement?",
      tag: "Iron", card: "hfe",
    },
  ];

  const checkedQuestions = questions.filter(q => qChecked[q.id]);

  function toggleQuestion(id: string) {
    setQChecked(prev => {
      const nextChecked = !prev[id];
      if (!nextChecked) {
        setQDiscussed(prevDiscussed => ({ ...prevDiscussed, [id]: false }));
      }
      return { ...prev, [id]: nextChecked };
    });
  }

  function addCardToSummary(cardId: string) {
    const cardQs = questions.filter(q => q.card === cardId);
    const allChecked = cardQs.every(q => qChecked[q.id]);
    setQChecked(prev => {
      const next = { ...prev };
      cardQs.forEach(q => { next[q.id] = !allChecked; });
      return next;
    });
  }

  function isCardAdded(cardId: string) {
    const cardQs = questions.filter(q => q.card === cardId);
    return cardQs.length > 0 && cardQs.every(q => qChecked[q.id]);
  }

  /* ── category chips config ── */
  const CHIPS = ["All", "Important", "Monitor", "Reassuring", "Blood-first", "DNA-driven", "Iron"];

  function shouldShowCard(card: DetailSheet) {
    if (!card) return false;

    const sourceAvailable =
      card === "med" ? dnaReady
      : card === "lipid" ? bloodReady
      : card === "methyl" ? dnaReady && bloodReady
      : card === "hfe" ? bloodReady && (!hfeWithGenotype || dnaReady)
      : false;

    if (!sourceAvailable) return false;
    if (activeChip === "All") return true;
    if (activeChip === "Important") return card === "med" || (card === "hfe" && hfeWithGenotype);
    if (activeChip === "Monitor") return card === "lipid" || (card === "methyl" && mthfrStatus === "monitor") || (card === "hfe" && !hfeWithGenotype);
    if (activeChip === "Reassuring") return card === "methyl" && mthfrStatus === "reassuring";
    if (activeChip === "Blood-first") return card === "lipid" || (card === "hfe" && !hfeWithGenotype);
    if (activeChip === "DNA-driven") return card === "med" || (card === "methyl" && mthfrStatus === "monitor");
    if (activeChip === "Iron") return card === "hfe";
    return true;
  }

  /* ═══════════════════════ DETAIL SHEET CONTENT ══════════════════════════ */

  function renderDetailSheet() {
    if (!detailSheet) return null;
    const close = () => setDetailSheet(null);

    if (detailSheet === "med") return (
      <DetailSheetModal
        title="Discuss clopidogrel with your prescribing clinician"
        statusLabel="Important" statusTagClass="bg-[#ff3b3020] text-[#d32f2f]"
        dnaBloodLabel="DNA-driven" domain="Medication"
        isAdded={isCardAdded("med")} onAddToSummary={() => addCardToSummary("med")} onClose={close}
      >
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">What we saw</p>
          <div className="divide-y divide-[#f0ede8]">
            <DataUsedRow text="CYP2C19 genotype: *2/*2 (from DNA file)" />
            <DataUsedRow text="Medication on file: Clopidogrel" />
            <DataUsedRow text="Clinical indication: cardiovascular (assumed)" />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Why it matters</p>
          <p className="leading-6 text-[#3a3a3c]">
            Your CYP2C19 result (*2/*2, Poor Metabolizer) suggests substantially reduced ability to activate clopidogrel. This is clinically relevant if you are currently taking it for a cardiovascular indication.
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">How DNA changed the output</p>
          <p className="leading-6 text-[#3a3a3c]">
            Without the genotype, this would be a standard medication check. With *2/*2, CPIC guidelines classify this as a strong pharmacogenomic signal — the genotype is the primary reason this finding is flagged Important.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Evidence trace</p>
          <div className="divide-y divide-[#f0ede8]">
            <EvidenceRow n={1} text="CYP2C19 *2/*2 → Poor Metabolizer (CPIC diplotype table)" />
            <EvidenceRow n={2} text="Poor Metabolizer + clopidogrel → strong CPIC alert" />
            <EvidenceRow n={3} text="Clopidogrel listed as current medication in your data" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions to bring</p>
          <div className="space-y-1.5">
            {questions.filter(q => q.card === "med").map(q => (
              <p key={q.id} className="flex items-start gap-1.5 leading-5 text-[#3a3a3c]">
                <span className="mt-0.5 shrink-0 text-[#c7c7cc]">·</span>{q.text}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#f5f4f0] px-3 py-3">
          <p className="text-xs font-semibold text-[#8e8e93]">What would change this result</p>
          <p className="mt-1 text-xs leading-5 text-[#3a3a3c]">Medication context or a clinician decision could change the next steps from this finding.</p>
        </div>
        <div className="rounded-xl bg-[#f5f4f0] px-3 py-3">
          <p className="text-xs font-semibold text-[#8e8e93]">Limit</p>
          <p className="mt-1 text-xs leading-5 text-[#3a3a3c]">Do not start, stop, or change medication based on this result alone. This is a question to bring to your prescribing clinician.</p>
        </div>
        <p className="text-[11px] text-[#c7c7cc]">Source: CPIC 2022 · PMID 35034351</p>
      </DetailSheetModal>
    );

    if (detailSheet === "lipid") return (
      <DetailSheetModal
        title={lipidSev === "monitor" ? "ApoB and LDL-C above optimal — worth discussing" : "Lipid values in borderline range — worth tracking"}
        statusLabel="Monitor" statusTagClass="bg-[#ff950020] text-[#b36200]"
        dnaBloodLabel="Blood-first signal" domain="Lipids"
        isAdded={isCardAdded("lipid")} onAddToSummary={() => addCardToSummary("lipid")} onClose={close}
      >
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">What we saw</p>
          <div className="divide-y divide-[#f0ede8]">
            <DataUsedRow text={`ApoB: ${vals.apob} mg/dL (from blood panel · ${panelLabel})`} />
            <DataUsedRow text={`LDL-C: ${vals.ldl} mg/dL (from blood panel · ${panelLabel})`} />
            <DataUsedRow text={`hs-CRP: ${vals.hscrp} mg/L (from blood panel · ${panelLabel})`} />
            <DataUsedRow text="Reference: NHANES adult population ranges" />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Why it matters</p>
          <p className="leading-6 text-[#3a3a3c]">Your blood test is the primary signal here. ApoB and LDL-C reflect current lipid burden, while hs-CRP adds an inflammation signal. DNA context does not drive this interpretation.</p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">How DNA changed (or didn&apos;t change) the output</p>
          <p className="leading-6 text-[#3a3a3c]">No genetic variant in your file currently changes the interpretation of these blood markers. This is a blood-first signal — the values stand on their own.</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Marker detail</p>
          <div className="space-y-4">
            {(["apob", "ldl", "hscrp"] as MarkerKey[]).map(k => {
              const cfg = MARKERS[k];
              const st = getStatus(k, vals[k]);
              const cl = statusColors(st);
              return (
                <div key={k}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">{cfg.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[20px] font-bold tabular-nums leading-none ${cl.value}`}>{vals[k]}</span>
                      <span className="text-xs text-[#8e8e93]">{cfg.unit}</span>
                      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cl.badge}`}>{getStatusLabel(st, k)}</span>
                    </div>
                  </div>
                  <SegmentedBar value={vals[k]} markerKey={k} />
                  <p className="mt-0.5 text-[10px] text-[#c7c7cc]">Optimal &lt;{cfg.optimalBelow} · Borderline {cfg.optimalBelow}–{cfg.borderlineBelow - 1} · High ≥{cfg.borderlineBelow}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Trend since last panel</p>
          <div className="overflow-hidden rounded-xl bg-[#f5f4f0]">
            <TrendRow label="ApoB" prev={PREV_PANEL.apob} current={vals.apob} unit="mg/dL" />
            <TrendRow label="LDL-C" prev={PREV_PANEL.ldl} current={vals.ldl} unit="mg/dL" />
            <TrendRow label="hs-CRP" prev={PREV_PANEL.hscrp} current={vals.hscrp} unit="mg/L" />
          </div>
          <p className="mt-1 text-[11px] text-[#c7c7cc]">{PREV_PANEL_LABEL} → {panelLabel}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions to bring</p>
          <div className="space-y-1.5">
            {questions.filter(q => q.card === "lipid").map(q => (
              <p key={q.id} className="flex items-start gap-1.5 leading-5 text-[#3a3a3c]">
                <span className="mt-0.5 shrink-0 text-[#c7c7cc]">·</span>{q.text}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#f5f4f0] px-3 py-3">
          <p className="text-xs font-semibold text-[#8e8e93]">What would change this result</p>
          <p className="mt-1 text-xs leading-5 text-[#3a3a3c]">A future panel trend showing improvement could move this from Monitor to a lower priority.</p>
        </div>
        <p className="text-[11px] text-[#c7c7cc]">Reference: NHANES adult population ranges · lab panel {panelLabel}</p>
      </DetailSheetModal>
    );

    if (detailSheet === "methyl") return (
      <DetailSheetModal
        title={`MTHFR variant · homocysteine ${vals.homocysteine} µmol/L — ${mthfrStatus === "monitor" ? "elevated" : "normal"}`}
        statusLabel={mthfrStatus === "monitor" ? "Monitor" : "Reassuring"}
        statusTagClass={mthfrStatus === "monitor" ? "bg-[#ff950020] text-[#b36200]" : "bg-[#34c75920] text-[#1d8338]"}
        dnaBloodLabel={mthfrStatus === "monitor" ? "Supported by blood" : "Not currently reflected"}
        domain="Methylation"
        isAdded={isCardAdded("methyl")} onAddToSummary={() => addCardToSummary("methyl")} onClose={close}
      >
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">What we saw</p>
          <div className="divide-y divide-[#f0ede8]">
            <DataUsedRow text="MTHFR variant: detected in DNA file" />
            <DataUsedRow text={`Homocysteine: ${vals.homocysteine} µmol/L (from blood panel · ${panelLabel})`} />
            {showExtraMarkers && <DataUsedRow text={`B12: ${b12} pg/mL · Folate: ${folate} ng/mL`} />}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Why it matters</p>
          <p className="leading-6 text-[#3a3a3c]">
            {mthfrStatus === "monitor"
              ? `An MTHFR variant appears in your DNA file. Your homocysteine (${vals.homocysteine} µmol/L) is above the normal range (5–15 µmol/L) — the blood marker is elevated, so this DNA context may be more relevant to discuss with your clinician.`
              : `An MTHFR variant appears in your DNA file. Your homocysteine (${vals.homocysteine} µmol/L) is within the normal range (5–15 µmol/L) — the current blood result is not showing an active signal related to this context.`}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">How DNA changed the output</p>
          <p className="leading-6 text-[#3a3a3c]">
            {mthfrStatus === "monitor"
              ? "The MTHFR variant makes the elevated homocysteine worth discussing with a clinician. Without the variant, it would still be flagged, but the DNA context adds a follow-up angle."
              : "The MTHFR variant is in the data, but homocysteine is normal, so there is no active blood signal to support a genotype-driven concern at this time."}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Current value</p>
          <div className="rounded-xl bg-[#f5f4f0] px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Homocysteine</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-[20px] font-bold tabular-nums leading-none ${statusColors(getStatus("homocysteine", vals.homocysteine)).value}`}>{vals.homocysteine}</span>
                <span className="text-xs text-[#8e8e93]">µmol/L</span>
              </div>
            </div>
            <SegmentedBar value={vals.homocysteine} markerKey="homocysteine" />
            <p className="mt-1 text-[10px] text-[#c7c7cc]">Normal range: 5–15 µmol/L</p>
          </div>
          {mthfrStatus === "reassuring" && (
            <p className="mt-2 text-xs text-[#8e8e93]">Edit homocysteine above 15 in the Inputs tab to see how this result changes.</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions to bring</p>
          <div className="space-y-1.5">
            {questions.filter(q => q.card === "methyl").map(q => (
              <p key={q.id} className="flex items-start gap-1.5 leading-5 text-[#3a3a3c]">
                <span className="mt-0.5 shrink-0 text-[#c7c7cc]">·</span>{q.text}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#f5f4f0] px-3 py-3">
          <p className="text-xs font-semibold text-[#8e8e93]">What would change this result</p>
          <p className="mt-1 text-xs leading-5 text-[#3a3a3c]">
            {mthfrStatus === "reassuring"
              ? "Homocysteine above 15 µmol/L would move this from Reassuring to Monitor."
              : "Homocysteine returning to the normal range would move this back to Reassuring."}
          </p>
        </div>
        <p className="text-[11px] text-[#c7c7cc]">Context only · MTHFR clinical utility varies · consult clinician</p>
      </DetailSheetModal>
    );

    if (detailSheet === "hfe") return (
      <DetailSheetModal
        title="HFE + iron markers — worked example"
        statusLabel={hfeWithGenotype ? "Important" : "Context"}
        statusTagClass={hfeWithGenotype ? "bg-[#007aff20] text-[#0055b3]" : "bg-[#f0ede8] text-[#8e8e93]"}
        dnaBloodLabel={hfeWithGenotype ? "DNA × blood" : "Blood-first signal"}
        domain="Iron"
        isAdded={isCardAdded("hfe")} onAddToSummary={() => addCardToSummary("hfe")} onClose={close}
      >
        {/* Toggle */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Toggle interpretation</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f5f4f0] p-1">
            <button onClick={() => setHfeWithGenotype(false)} className={`rounded-lg py-2 text-xs font-semibold transition-all ${!hfeWithGenotype ? "bg-white shadow-sm text-[#1c1c1e]" : "text-[#8e8e93]"}`}>Blood only</button>
            <button onClick={() => setHfeWithGenotype(true)}  className={`rounded-lg py-2 text-xs font-semibold transition-all ${hfeWithGenotype ? "bg-[#007aff] text-white shadow-sm" : "text-[#8e8e93]"}`}>Blood + DNA</button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">What we saw</p>
          <div className="divide-y divide-[#f0ede8]">
            <DataUsedRow text="Ferritin: 420 µg/L · above demo lab reference range" />
            <DataUsedRow text="TSAT: 58% · above demo lab reference range" />
            {hfeWithGenotype && <DataUsedRow text="HFE C282Y/C282Y (rs1800562 homozygous) — from DNA file" />}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">How DNA changed the output</p>
          <div className={`rounded-xl px-3 py-3 ${hfeWithGenotype ? "border border-[#007aff30] bg-[#007aff06]" : "bg-[#f5f4f0]"}`}>
            <p className="text-sm leading-6 text-[#3a3a3c]">
              {hfeWithGenotype
                ? "Discuss whether an HFE-related iron overload evaluation is appropriate. HFE C282Y has incomplete penetrance — this does not diagnose iron overload. Ferritin can be elevated for other reasons."
                : "Discuss repeat fasting iron studies and possible inflammation, liver, and metabolic context with your clinician."}
            </p>
            <div className={`mt-2 rounded-lg px-2.5 py-2 ${hfeWithGenotype ? "bg-[#007aff12]" : "bg-white/70"}`}>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">Clinician question</p>
              <p className="text-xs leading-5 text-[#3a3a3c]">
                {hfeWithGenotype
                  ? "Is an HFE-related iron overload evaluation appropriate given these iron markers and HFE C282Y/C282Y?"
                  : "These iron markers are elevated — should I repeat fasting iron studies and check for inflammation or liver involvement?"}
              </p>
            </div>
          </div>
        </div>
        {hfeWithGenotype && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#1c1c1e]">What genotype changed</p>
            <GenotypeDeltaRow text="Interpretation priority — a specific evaluation pathway is now worth discussing" />
            <GenotypeDeltaRow text="The clinician question — from broad iron workup to HFE-specific evaluation" />
            <GenotypeDeltaRow text="Which uncertainty matters — iron overload vs. inflammation vs. other causes" />
          </div>
        )}
        {/* End-to-end trace */}
        <div>
          <button onClick={() => setShowHfeTrace(p => !p)} className="flex w-full items-center justify-between py-1">
            <span className="text-xs font-semibold text-[#007aff]">End-to-end trace</span>
            <ChevronIcon open={showHfeTrace} />
          </button>
          {showHfeTrace && (
            <div className="mt-3 space-y-3">
              <div className="divide-y divide-[#f0ede8]">
                <EvidenceRow n={1} text="elevated_ferritin → ferritin above lab reference range" />
                <EvidenceRow n={2} text="elevated_transferrin_saturation → TSAT ≥ 45% (EASL 2022)" />
                {hfeWithGenotype ? (
                  <>
                    <EvidenceRow n={3} text="hfe_genotype_relevant → C282Y homozygous → genotype_changes_priority = true" />
                    <EvidenceRow n={4} text="combined_iron_signal → rules 1+2+3 → priority: clinician discussion" />
                  </>
                ) : (
                  <EvidenceRow n={3} text="blood_only_iron_signal → no genotype → priority: monitor" />
                )}
              </div>
              <div className="rounded-lg bg-[#f5f4f0] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[#1c1c1e]">Incomplete penetrance note</p>
                <p className="mt-0.5 text-[11px] leading-[1.4] text-[#8e8e93]">Most C282Y homozygotes do not develop clinical iron overload. Genotype changes the question — not the diagnosis.</p>
              </div>
              <p className="text-[10px] text-[#c7c7cc]">Sources: EASL 2022 · ClinVar pathogenic · ClinGen definitive</p>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-[#f5f4f0] px-3 py-3">
          <p className="text-xs font-semibold text-[#8e8e93]">What would change this result</p>
          <p className="mt-1 text-xs leading-5 text-[#3a3a3c]">
            {hfeWithGenotype
              ? "Removing genotype context would revert this to a blood-first monitoring signal."
              : "Adding HFE C282Y/C282Y genotype changes output from blood-first monitoring to a DNA × blood clinician discussion."}
          </p>
        </div>
        <p className="text-[11px] text-[#c7c7cc]">This is a worked example. HFE data in this prototype is for demonstration only.</p>
      </DetailSheetModal>
    );

    return null;
  }

  /* ═══════════════════════════ TAB CONTENT ══════════════════════════════ */

  function renderResults() {
    return (
      <div className="pb-28">
        {/* Header */}
        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Today</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Your {panelLabel} check</h1>
          <p className="mt-1 text-sm text-[#3a3a3c]">
            {readySourceCount === 3 ? "DNA + blood results ready" : `${readySourceCount}/3 data sources ready`}
          </p>
        </header>

        {/* Summary card */}
        <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-[#1c1c1e]">{dnaReady ? "1 result to discuss with your clinician" : "DNA findings unavailable"}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dnaReady ? "bg-[#ff3b3020] text-[#d32f2f]" : "bg-[#f0ede8] text-[#8e8e93]"}`}>{dnaReady ? "Discuss" : "Missing"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#f0ede8] px-4 py-3">
            <span className="text-sm text-[#3a3a3c]">{bloodReady ? `${nonOptimalCount} marker${nonOptimalCount !== 1 ? "s" : ""} above optimal range` : "Blood marker status unavailable"}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bloodReady ? "bg-[#ff950020] text-[#b36200]" : "bg-[#f0ede8] text-[#8e8e93]"}`}>{bloodReady ? "Monitor" : "Missing"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#f0ede8] px-4 py-3">
            <span className="text-sm text-[#3a3a3c]">{dnaReady && bloodReady ? `${mthfrStatus === "reassuring" ? "1 result" : "0 results"} currently reassuring` : "Combined DNA × blood check unavailable"}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dnaReady && bloodReady && mthfrStatus === "reassuring" ? "bg-[#34c75920] text-[#1d8338]" : "bg-[#f0ede8] text-[#8e8e93]"}`}>
              {dnaReady && bloodReady ? (mthfrStatus === "reassuring" ? "OK" : "None") : "Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#f0ede8] px-4 py-3">
            <span className="text-xs text-[#8e8e93]">
              Data: {dnaReady ? "DNA" : "DNA missing"} · {bloodReady ? "blood panel" : "blood missing"} · medication
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${readySourceCount === 3 ? "bg-[#007aff15] text-[#0055b3]" : "bg-[#ff950020] text-[#b36200]"}`}>{readySourceCount}/3 ready</span>
          </div>
        </div>

        {readySourceCount < 3 && (
          <div className="mx-4 mb-5 rounded-2xl bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1c1c1e]">Some results are hidden until data is restored</p>
            <p className="mt-1 text-xs leading-5 text-[#8e8e93]">
              {dnaReady ? "DNA file ready." : "DNA-dependent medication and methylation cards are hidden."} {bloodReady ? "Blood panel ready." : "Blood-dependent lipid, methylation, and iron cards are hidden."}
            </p>
            <button onClick={() => setActiveTab("data")} className="mt-3 text-sm font-semibold text-[#007aff]">Manage data →</button>
          </div>
        )}

        {/* Next best action */}
        <div className="mx-4 mb-5 overflow-hidden rounded-2xl bg-[#1c1c1e] px-4 py-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Next best action</p>
          <p className="mt-1 text-[15px] font-bold text-white">Prepare your clinician questions</p>
          <p className="mt-0.5 text-xs text-white/60">{checkedQuestions.length} question{checkedQuestions.length !== 1 ? "s" : ""} selected · review before your appointment</p>
          <button
            onClick={() => setActiveTab("questions")}
            className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#1c1c1e]"
          >
            Go to Doctor prep →
          </button>
        </div>

        {/* Category chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                activeChip === chip ? "bg-[#1c1c1e] text-white" : "bg-white text-[#8e8e93] shadow-sm"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Result cards */}
        <div className="flex flex-col gap-3 px-4">

          {/* Card 1 — CYP2C19 */}
          {shouldShowCard("med") && <ResultCard
            highlighted
            statusLabel="Important" statusHeaderBg="bg-[#ff3b30]"
            statusTagClass="bg-[#ff3b3020] text-[#d32f2f]"
            dnaBloodLabel="DNA-driven" domain="Medication"
            title="Discuss clopidogrel with your prescribing clinician"
            summary="CYP2C19 *2/*2 · Poor Metabolizer · CPIC alert"
            dataUsed="CYP2C19 *2/*2 + clopidogrel on file"
            question="Are there medication options that fit my CYP2C19 result better?"
            evidence="CPIC 2022 pharmacogenetic guideline"
            isAdded={isCardAdded("med")}
            onViewDetails={() => setDetailSheet("med")}
            onAddToSummary={() => addCardToSummary("med")}
          />}

          {/* Card 2 — Lipids */}
          {shouldShowCard("lipid") && <ResultCard
            statusLabel="Monitor" statusHeaderBg="bg-[#ff9500]"
            statusTagClass="bg-[#ff950020] text-[#b36200]"
            dnaBloodLabel="Blood-first signal" domain="Lipids"
            title={lipidSev === "monitor" ? "ApoB and LDL-C above optimal — worth discussing" : "Lipid values in borderline range — worth tracking"}
            summary={`ApoB ${vals.apob} · LDL-C ${vals.ldl} · hs-CRP ${vals.hscrp}`}
            dataUsed={`${panelLabel} blood panel · ApoB, LDL-C, hs-CRP`}
            question={`My ApoB is ${vals.apob} mg/dL — should this trigger a lipid review?`}
            evidence="Lab panel + adult lipid reference ranges"
            isAdded={isCardAdded("lipid")}
            onViewDetails={() => setDetailSheet("lipid")}
            onAddToSummary={() => addCardToSummary("lipid")}
          >
            <div className="flex gap-3">
              {(["apob", "ldl", "hscrp"] as MarkerKey[]).map(k => {
                const st = getStatus(k, vals[k]);
                const cl = statusColors(st);
                return (
                  <div key={k} className="flex-1 text-center">
                    <p className={`text-[17px] font-bold tabular-nums leading-none ${cl.value}`}>{vals[k]}</p>
                    <p className="mt-0.5 text-[10px] text-[#8e8e93]">{MARKERS[k].name}</p>
                  </div>
                );
              })}
            </div>
          </ResultCard>}

          {/* Card 3 — MTHFR */}
          {shouldShowCard("methyl") && <ResultCard
            statusLabel={mthfrStatus === "monitor" ? "Monitor" : "Reassuring"}
            statusHeaderBg={mthfrStatus === "monitor" ? "bg-[#ff9500]" : "bg-[#34c759]"}
            statusTagClass={mthfrStatus === "monitor" ? "bg-[#ff950020] text-[#b36200]" : "bg-[#34c75920] text-[#1d8338]"}
            dnaBloodLabel={mthfrStatus === "monitor" ? "Supported by blood" : "Not currently reflected"}
            domain="Methylation"
            title={`MTHFR variant · homocysteine ${vals.homocysteine} µmol/L — ${mthfrStatus === "monitor" ? "elevated" : "normal"}`}
            summary={mthfrStatus === "monitor" ? "Blood marker elevated · DNA context may be relevant" : "Normal homocysteine · no active signal"}
            dataUsed="MTHFR variant + current homocysteine value"
            question="Does MTHFR matter if my homocysteine is normal?"
            evidence="Blood marker context + methylation pathway caveat"
            isAdded={isCardAdded("methyl")}
            onViewDetails={() => setDetailSheet("methyl")}
            onAddToSummary={() => addCardToSummary("methyl")}
          />}

          {/* Card 4 — HFE */}
          {shouldShowCard("hfe") && <ResultCard
            statusLabel={hfeWithGenotype ? "Important" : "Context"}
            statusHeaderBg={hfeWithGenotype ? "bg-[#007aff]" : "bg-[#8e8e93]"}
            statusTagClass={hfeWithGenotype ? "bg-[#007aff20] text-[#0055b3]" : "bg-[#f0ede8] text-[#8e8e93]"}
            dnaBloodLabel={hfeWithGenotype ? "DNA × blood" : "Blood-first signal"}
            domain="Iron"
            title="HFE + iron markers — worked example"
            summary="Shows how genotype context changes the interpretation"
            dataUsed={hfeWithGenotype ? "Ferritin + TSAT + HFE C282Y/C282Y" : "Ferritin + TSAT only"}
            question={hfeWithGenotype ? "Is an HFE-related iron overload evaluation appropriate?" : "Should I repeat fasting iron studies first?"}
            evidence="EASL 2022 + ClinVar / ClinGen context"
            isAdded={isCardAdded("hfe")}
            onViewDetails={() => setDetailSheet("hfe")}
            onAddToSummary={() => addCardToSummary("hfe")}
          >
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setHfeWithGenotype(false)} className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all ${!hfeWithGenotype ? "bg-[#1c1c1e] text-white" : "bg-[#f5f4f0] text-[#8e8e93]"}`}>Blood only</button>
              <button
                onClick={() => dnaReady && setHfeWithGenotype(true)}
                disabled={!dnaReady}
                className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all ${hfeWithGenotype ? "bg-[#007aff] text-white" : !dnaReady ? "bg-[#f5f4f0] text-[#c7c7cc]" : "bg-[#f5f4f0] text-[#8e8e93]"}`}
              >
                {dnaReady ? "Blood + DNA" : "DNA missing"}
              </button>
            </div>
          </ResultCard>}

          {!["med", "lipid", "methyl", "hfe"].some(card => shouldShowCard(card as DetailSheet)) && (
            <div className="rounded-2xl bg-white px-4 py-5 text-center shadow-sm">
              <p className="text-sm font-semibold text-[#1c1c1e]">{readySourceCount < 3 ? "No available results with current data" : "No results in this filter"}</p>
              <p className="mt-1 text-xs text-[#8e8e93]">
                {readySourceCount < 3 ? "Restore missing data in the Data tab, or switch to a broader filter." : "Try All or another category chip."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderInputs() {
    return (
      <div className="pb-28">
        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Your data</h1>
          <p className="mt-1 text-sm text-[#3a3a3c]">What was used to generate these results</p>
        </header>

        {/* DNA file */}
        <SectionLabel>DNA file</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-[#f0ede8]">
            <p className="text-sm font-semibold">23andMe raw data</p>
            <p className="text-xs text-[#8e8e93]">{dnaDeleted ? "Deleted from this prototype session" : "Demo · May 2026"}</p>
          </div>
          {dnaDeleted ? (
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-[#1c1c1e]">DNA file removed</p>
              <p className="mt-1 text-xs leading-5 text-[#8e8e93]">DNA-dependent result cards are hidden until the demo file is restored.</p>
              <button onClick={() => { setDnaDeleted(false); setDataCleared(false); }} className="mt-3 text-sm font-semibold text-[#007aff]">Restore demo DNA file</button>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ede8]">
              {[
                { gene: "CYP2C19", result: "*2/*2 · Poor Metabolizer", status: "found" },
                { gene: "MTHFR",   result: "Variant detected",         status: "found" },
                { gene: "HFE",     result: "C282Y/C282Y (demo)",        status: "demo"  },
                { gene: "APOE",    result: "Not used in this prototype", status: "n/a"   },
              ].map(row => (
                <div key={row.gene} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-semibold text-[#1c1c1e]">{row.gene}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8e8e93]">{row.result}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.status === "found" ? "bg-[#34c75920] text-[#1d8338]"
                      : row.status === "demo" ? "bg-[#007aff15] text-[#0055b3]"
                      : "bg-[#f0ede8] text-[#8e8e93]"
                    }`}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Blood panel */}
        <SectionLabel>Blood panel</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-[#f0ede8]">
            <p className="text-sm font-semibold">{panelLabel} lab report</p>
            <p className="text-xs text-[#8e8e93]">{bloodDeleted ? "Deleted from this prototype session" : "Demo · 6 markers"}</p>
          </div>
          {bloodDeleted ? (
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-[#1c1c1e]">Blood panel removed</p>
              <p className="mt-1 text-xs leading-5 text-[#8e8e93]">Restore the demo panel to edit marker values and compare trends again.</p>
              <button onClick={() => { setBloodDeleted(false); setDataCleared(false); }} className="mt-3 text-sm font-semibold text-[#007aff]">Restore demo blood panel</button>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ede8]">
              {[
                { name: "ApoB",        val: `${vals.apob} mg/dL`,        status: getStatus("apob", vals.apob) },
                { name: "LDL-C",       val: `${vals.ldl} mg/dL`,         status: getStatus("ldl", vals.ldl) },
                { name: "hs-CRP",      val: `${vals.hscrp} mg/L`,        status: getStatus("hscrp", vals.hscrp) },
                { name: "Homocysteine",val: `${vals.homocysteine} µmol/L`,status: getStatus("homocysteine", vals.homocysteine) },
                { name: "Ferritin",    val: "420 µg/L (demo)",           status: "high" as Status },
                { name: "TSAT",        val: "58% (demo)",                status: "high" as Status },
              ].map(row => {
                const dot = row.status === "high" ? "bg-[#ff3b30]" : row.status === "borderline" ? "bg-[#ff9500]" : "bg-[#34c759]";
                return (
                  <div key={row.name} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${dot}`} />
                      <span className="text-sm font-semibold text-[#1c1c1e]">{row.name}</span>
                    </div>
                    <span className="text-xs text-[#8e8e93]">{row.val}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Medication */}
        <SectionLabel>Medication on file</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold">Clopidogrel</span>
            <span className="rounded-full bg-[#34c75920] px-2 py-0.5 text-[10px] font-semibold text-[#1d8338]">On file</span>
          </div>
          <p className="border-t border-[#f0ede8] px-4 py-3 text-xs text-[#8e8e93]">Prototype data · editable here · not uploaded anywhere.</p>
        </section>

        {/* Editable markers */}
        <SectionLabel>Edit blood values</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            {(Object.keys(MARKERS) as MarkerKey[]).map(k => {
              const cfg = MARKERS[k];
              const status = getStatus(k, vals[k]);
              const colors = statusColors(status);
              const isEditing = editingKey === k;
              return (
                <div key={k} className="px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">{cfg.name}</span>
                    <div className="flex items-baseline gap-2">
                      {isEditing ? (
                        <input
                          autoFocus type="number" step="0.1"
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === "Enter" && commitEdit()}
                          className="w-20 text-right text-[20px] font-bold tabular-nums text-[#007aff] focus:outline-none bg-transparent"
                        />
                      ) : (
                        <span className={`text-[20px] font-bold tabular-nums leading-none ${colors.value}`}>{vals[k]}</span>
                      )}
                      <span className="text-xs text-[#8e8e93]">{cfg.unit}</span>
                      {!isEditing && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>{getStatusLabel(status, k)}</span>}
                    </div>
                  </div>
                  <SegmentedBar value={vals[k]} markerKey={k} />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-[#c7c7cc]">{k === "homocysteine" ? "Normal 5–15 µmol/L" : `Optimal <${cfg.optimalBelow} · High ≥${cfg.borderlineBelow}`}</p>
                    {isEditing
                      ? <button onClick={commitEdit} className="text-[11px] font-semibold text-[#007aff]">Update</button>
                      : <button onClick={() => { setEditingKey(k); setEditDraft(String(vals[k])); }} className="text-[11px] font-semibold text-[#007aff]">Edit</button>}
                  </div>
                </div>
              );
            })}
          </div>
          {!showExtraMarkers ? (
            <div className="border-t border-[#f0ede8] px-4 py-3">
              <button onClick={() => setShowExtraMarkers(true)} className="flex items-center gap-1.5 text-sm font-semibold text-[#007aff]">
                <span>＋</span> Add B12 / folate
              </button>
            </div>
          ) : (
            <div className="border-t border-[#f0ede8] px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-[#8e8e93]">
                  B12 (pg/mL)
                  <input type="number" value={b12} onChange={e => setB12(e.target.value)} className="mt-1 w-full rounded-xl bg-[#f5f4f0] px-3 py-2 text-sm font-bold text-[#1c1c1e] focus:outline-none" />
                </label>
                <label className="text-xs font-semibold text-[#8e8e93]">
                  Folate (ng/mL)
                  <input type="number" value={folate} onChange={e => setFolate(e.target.value)} className="mt-1 w-full rounded-xl bg-[#f5f4f0] px-3 py-2 text-sm font-bold text-[#1c1c1e] focus:outline-none" />
                </label>
              </div>
              <p className="text-[11px] text-[#c7c7cc]">B12 {b12} pg/mL · Folate {folate} ng/mL — context only</p>
            </div>
          )}
        </section>

        {/* Panel comparison */}
        <SectionLabel>Panel comparison</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-[#8e8e93]">{PREV_PANEL_LABEL} → {panelLabel}</p>
          </div>
          <div className="divide-y divide-[#f0ede8]">
            <TrendRow label="ApoB"   prev={PREV_PANEL.apob}  current={vals.apob}  unit="mg/dL" />
            <TrendRow label="LDL-C"  prev={PREV_PANEL.ldl}   current={vals.ldl}   unit="mg/dL" />
            <TrendRow label="hs-CRP" prev={PREV_PANEL.hscrp} current={vals.hscrp} unit="mg/L"  />
          </div>
          <div className="border-t border-[#f0ede8] px-4 py-3">
            <button onClick={uploadNewerPanel} className="text-sm font-semibold text-[#007aff]">
              {panelUploaded ? "June 2026 panel loaded ✓" : "Upload newer panel →"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  function renderQuestions() {
    const groups = [
      { tag: "Medication",   qs: questions.filter(q => q.tag === "Medication") },
      { tag: "Blood",        qs: questions.filter(q => q.tag === "Blood") },
      { tag: "DNA",          qs: questions.filter(q => q.tag === "DNA") },
      { tag: "Iron",         qs: questions.filter(q => q.tag === "Iron") },
    ];
    const tagColors: Record<string, string> = {
      Medication: "bg-[#ff3b3015] text-[#d32f2f]",
      Blood:      "bg-[#ff950015] text-[#b36200]",
      DNA:        "bg-[#007aff15] text-[#0055b3]",
      Iron:       "bg-[#34c75915] text-[#1d8338]",
    };

    return (
      <div className="pb-28">
        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Doctor prep</h1>
          <p className="mt-1 text-sm text-[#3a3a3c]">{checkedQuestions.length} of {questions.length} questions selected</p>
        </header>

        {/* Before */}
        <SectionLabel>Before your appointment</SectionLabel>
        <p className="mb-3 px-4 text-xs text-[#8e8e93]">Select which questions to bring</p>
        {groups.map(({ tag, qs }) => (
          <div key={tag} className="mb-4">
            <SectionLabel>{tag}</SectionLabel>
            <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="divide-y divide-[#f0ede8]">
                {qs.map(q => (
                  <label key={q.id} className="flex cursor-pointer items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!qChecked[q.id]}
                      onChange={() => toggleQuestion(q.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#007aff]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-5 text-[#1c1c1e]">{q.text}</p>
                      <p className="mt-0.5 text-[11px] text-[#c7c7cc]">from {q.card} result</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagColors[q.tag]}`}>{q.tag}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        ))}

        {/* During */}
        <SectionLabel>During your appointment</SectionLabel>
        {checkedQuestions.length === 0 ? (
          <div className="mx-4 mb-4 rounded-2xl bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-xs text-[#8e8e93]">Select questions above to track during your appointment</p>
          </div>
        ) : (
          <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="divide-y divide-[#f0ede8]">
              {checkedQuestions.map(q => (
                <div key={q.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-5 ${qDiscussed[q.id] ? "line-through text-[#c7c7cc]" : "text-[#1c1c1e]"}`}>{q.text}</p>
                  </div>
                  <button
                    onClick={() => setQDiscussed(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      qDiscussed[q.id] ? "bg-[#34c75920] text-[#1d8338]" : "bg-[#f5f4f0] text-[#3a3a3c]"
                    }`}
                  >
                    {qDiscussed[q.id] ? "Discussed ✓" : "Mark discussed"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* After */}
        <SectionLabel>After your appointment</SectionLabel>
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-[#1c1c1e]">Clinician note</p>
            <p className="mt-0.5 text-xs text-[#8e8e93]">Record what your clinician recommended</p>
          </div>
          <div className="border-t border-[#f0ede8] px-4 py-3">
            <textarea
              value={clinicianNote}
              onChange={e => setClinicianNote(e.target.value)}
              placeholder="e.g. Order repeat lipid panel in 3 months, continue current medication..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-[#1c1c1e] placeholder:text-[#c7c7cc] focus:outline-none"
            />
          </div>
          <div className="border-t border-[#f0ede8] px-4 py-3">
            <button
              onClick={() => setReminderSet(true)}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                reminderSet ? "bg-[#34c75920] text-[#1d8338]" : "bg-[#f5f4f0] text-[#1c1c1e]"
              }`}
            >
              {reminderSet ? "Reminder set ✓" : "Set retest reminder"}
            </button>
          </div>
        </section>

        <div className="mx-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowSummary(true)}
            className="rounded-2xl bg-[#1c1c1e] py-3 text-sm font-semibold text-white"
          >
            Preview summary
          </button>
          <button
            onClick={() => {
              const discussedQuestions = checkedQuestions.filter(q => qDiscussed[q.id]);
              const lines = [
                "Patient-prepared discussion summary",
                "",
                `Data sources: ${dnaReady ? "DNA ready" : "DNA missing"} · ${bloodReady ? "blood panel ready" : "blood panel missing"} · medication ready`,
                "",
                "Questions to bring:",
                ...(checkedQuestions.length ? checkedQuestions.map((q, i) => `${i + 1}. ${q.text}`) : ["None selected"]),
                "",
                "Discussed during appointment:",
                ...(discussedQuestions.length ? discussedQuestions.map((q, i) => `${i + 1}. ${q.text}`) : ["None marked yet"]),
                ...(clinicianNote.trim() ? ["", "Clinician note:", clinicianNote.trim()] : []),
                "",
                `Retest reminder: ${reminderSet ? "set" : "not set"}`,
                "",
                "Do not start, stop, or change medication based on this summary alone.",
              ];
              navigator.clipboard?.writeText(lines.join("\n"));
            }}
            className="rounded-2xl border border-[#d1d1d6] py-3 text-sm font-semibold text-[#1c1c1e]"
          >
            Copy to clipboard
          </button>
        </div>
        <p className="mt-3 px-4 text-center text-[11px] text-[#c7c7cc]">
          Tap a result card&apos;s &quot;Add to summary&quot; to pre-select its questions
        </p>
      </div>
    );
  }

  function renderEvidence() {
    const consumerCards = [
      {
        id: "cpic",
        title: "CPIC 2022 — CYP2C19 × clopidogrel",
        source: "Clinical Pharmacogenetics Implementation Consortium",
        why: "Guideline used to classify CYP2C19 *2/*2 + clopidogrel as a strong pharmacogenomic alert. PMID 35034351.",
        badge: "Drug-gene",
      },
      {
        id: "nhanes",
        title: "Population reference ranges",
        source: "NHANES adult lipid reference data",
        why: "Used to classify ApoB, LDL-C, hs-CRP, and homocysteine values relative to a general adult population.",
        badge: "Lab ranges",
      },
      {
        id: "easl",
        title: "EASL 2022 — HFE iron metabolism",
        source: "European Association for the Study of the Liver",
        why: "Used for TSAT threshold (≥45%) and to frame the HFE worked example. This is a demonstration of evidence-driven output framing.",
        badge: "Iron",
      },
      {
        id: "clinvar",
        title: "ClinVar / ClinGen — HFE C282Y",
        source: "ClinVar pathogenic classification · ClinGen definitive gene-disease",
        why: "HFE C282Y/C282Y is classified as pathogenic for hereditary hemochromatosis risk. ClinGen classifies the HFE–iron overload association as definitive.",
        badge: "Genetics",
      },
    ];

    const advancedTraces = [
      {
        id: "cyp2c19",
        title: "CYP2C19 + clopidogrel — full trace",
        rows: [
          { label: "Input: DNA diplotype", value: "*2/*2" },
          { label: "Phenotype lookup", value: "*2/*2 → Poor Metabolizer (CPIC table)" },
          { label: "Rule fired", value: "Poor Metabolizer + clopidogrel → strong alert" },
          { label: "Evidence source", value: "CPIC 2022 · PMID 35034351" },
          { label: "Conflict check", value: "Indication assumed cardiovascular — not confirmed" },
          { label: "Output", value: "Priority: Important · DNA-driven · Discuss with clinician" },
          { label: "Safety boundary", value: "Do not instruct user to change medication" },
        ],
      },
      {
        id: "lipids",
        title: "Lipid markers — full trace",
        rows: [
          { label: "Input: ApoB",    value: `${vals.apob} mg/dL` },
          { label: "Input: LDL-C",   value: `${vals.ldl} mg/dL` },
          { label: "Input: hs-CRP",  value: `${vals.hscrp} mg/L` },
          { label: "Rule fired",     value: "ApoB ≥ 120 → borderline-high flag" },
          { label: "DNA check",      value: "No variant in file changes lipid interpretation" },
          { label: "Evidence source",value: "NHANES adult reference · lab panel" },
          { label: "Output",         value: "Priority: Monitor · Blood-first signal" },
        ],
      },
      {
        id: "hfe",
        title: "HFE + iron markers — full trace",
        rows: [
          { label: "Input: Ferritin",    value: "420 µg/L · above demo lab ref" },
          { label: "Input: TSAT",        value: "58% · above demo lab ref (≥45% threshold)" },
          { label: "Input: HFE variant", value: hfeWithGenotype ? "C282Y/C282Y (rs1800562 homozygous)" : "Not in this scenario" },
          { label: "Rules fired",        value: hfeWithGenotype ? "elevated_ferritin + elevated_tsat + hfe_genotype → clinician discussion" : "elevated_ferritin + elevated_tsat → monitor (no genotype)" },
          { label: "Conflict check",     value: "Ferritin non-specific · C282Y incomplete penetrance · lab ref variability" },
          { label: "Evidence source",    value: "EASL 2022 · ClinVar pathogenic · ClinGen definitive" },
          { label: "Output",             value: hfeWithGenotype ? "Priority: Important · DNA × blood" : "Priority: Monitor · Blood-first signal" },
        ],
      },
    ];

    return (
      <div className="pb-28">
        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Evidence</h1>
          <p className="mt-1 text-sm text-[#3a3a3c]">Sources used to generate your results</p>
        </header>

        <SectionLabel>Evidence used</SectionLabel>
        <div className="mx-4 mb-5 flex flex-col gap-3">
          {consumerCards.map(card => (
            <div key={card.id} className="overflow-hidden rounded-2xl bg-white shadow-sm px-4 py-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-[#1c1c1e]">{card.title}</p>
                <span className="shrink-0 rounded-full bg-[#007aff15] px-2 py-0.5 text-[10px] font-semibold text-[#0055b3]">{card.badge}</span>
              </div>
              <p className="text-[11px] font-semibold text-[#8e8e93] mb-1">{card.source}</p>
              <p className="text-xs leading-5 text-[#3a3a3c]">{card.why}</p>
            </div>
          ))}
        </div>

        <SectionLabel>Advanced trace</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          {advancedTraces.map((trace, i) => (
            <div key={trace.id} className={i > 0 ? "border-t border-[#f0ede8]" : ""}>
              <button
                onClick={() => setOpenEvidence(prev => prev === trace.id ? null : trace.id)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <span className="text-sm font-semibold text-[#1c1c1e]">{trace.title}</span>
                <ChevronIcon open={openEvidence === trace.id} />
              </button>
              {openEvidence === trace.id && (
                <div className="border-t border-[#f0ede8]">
                  {trace.rows.map(row => <TraceRow key={row.label} label={row.label} value={row.value} />)}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="mx-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold text-[#1c1c1e]">About AI wording</p>
          <p className="mt-1 text-xs leading-5 text-[#8e8e93]">
            AI is used to turn structured rule-engine findings into plain-language explanations. It is not the medical evidence source — the source is always a named guideline or reference dataset.
          </p>
        </div>
      </div>
    );
  }

  function renderData() {
    return (
      <div className="pb-28">
        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Data &amp; privacy</h1>
          <p className="mt-1 text-sm text-[#3a3a3c]">Export, delete, and understand your data</p>
        </header>

        <SectionLabel>Export</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <button onClick={() => setShowSummary(true)} className="flex w-full items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Export doctor summary</span>
              <span className="text-xs text-[#007aff]">Preview ›</span>
            </button>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Export PDF report</span>
              <span className="text-xs text-[#c7c7cc]">Coming in MVP</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Download raw data JSON</span>
              <span className="text-xs text-[#c7c7cc]">Coming in MVP</span>
            </div>
          </div>
        </section>

        <SectionLabel>Data management</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-[#1c1c1e]">DNA file</p>
                <p className="text-xs text-[#8e8e93]">{dnaDeleted ? "Deleted from this prototype session" : "23andMe raw data · demo"}</p>
              </div>
              <button
                onClick={() => {
                  setDnaDeleted(prev => {
                    const next = !prev;
                    if (next) {
                      setHfeWithGenotype(false);
                      setQChecked(prevChecked => ({ ...prevChecked, q1: false, q2: false, q5: false }));
                      setQDiscussed(prevDiscussed => ({ ...prevDiscussed, q1: false, q2: false, q5: false }));
                    }
                    return next;
                  });
                  setDataCleared(false);
                }}
                className={`text-xs font-semibold ${dnaDeleted ? "text-[#007aff]" : "text-[#ff3b30]"}`}
              >
                {dnaDeleted ? "Restore" : "Delete"}
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-[#1c1c1e]">Blood panel</p>
                <p className="text-xs text-[#8e8e93]">{bloodDeleted ? "Deleted from this prototype session" : `${panelLabel} · 6 markers`}</p>
              </div>
              <button
                onClick={() => {
                  setBloodDeleted(prev => {
                    const next = !prev;
                    if (next) {
                      setQChecked(prevChecked => ({ ...prevChecked, q3: false, q4: false, q6: false }));
                      setQDiscussed(prevDiscussed => ({ ...prevDiscussed, q3: false, q4: false, q6: false }));
                    }
                    return next;
                  });
                  setDataCleared(false);
                }}
                className={`text-xs font-semibold ${bloodDeleted ? "text-[#007aff]" : "text-[#ff3b30]"}`}
              >
                {bloodDeleted ? "Restore" : "Delete"}
              </button>
            </div>
            <button
              onClick={resetDemoSession}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <span className="text-sm font-semibold text-[#1c1c1e]">Clear all demo data</span>
              <span className={`text-xs font-semibold ${dataCleared ? "text-[#34c759]" : "text-[#ff9500]"}`}>
                {dataCleared ? "Cleared ✓" : "Return to empty state →"}
              </span>
            </button>
          </div>
        </section>

        <SectionLabel>Privacy</SectionLabel>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">Data storage</p>
              <p className="mt-0.5 text-xs leading-5 text-[#8e8e93]">Prototype only. All data stays in your browser session. Nothing is sent to external servers.</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">AI wording</p>
              <p className="mt-0.5 text-xs leading-5 text-[#8e8e93]">AI is used to turn structured findings into plain-language explanations. It is not the medical evidence source.</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">Medical disclaimer</p>
              <p className="mt-0.5 text-xs leading-5 text-[#8e8e93]">This prototype is not a diagnosis and should not be used to start, stop, or change medication. Always consult your prescribing clinician.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ═══════════════════════════ RENDER ════════════════════════════════════ */

  if (!consentAccepted) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center px-6 text-[#1c1c1e]">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 text-center">
            <p className="text-[38px] font-bold tracking-tight">HealthLens</p>
            <p className="mt-2 text-base text-[#3a3a3c]">Understand your health data — DNA and blood together</p>
          </div>
          <div className="mb-8 space-y-3">
            {[
              "Combines genetic variants with your blood marker values",
              "Flags relevant drug-gene interactions using published guidelines",
              "Prepares you for an informed conversation with your clinician",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-sm font-bold text-[#007aff]">✓</span>
                <p className="text-sm leading-5 text-[#3a3a3c]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mb-5 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs leading-5 text-[#8e8e93]">Prototype only — all data stays in your browser session. Nothing is sent to external servers. This is not a medical diagnosis.</p>
          </div>
          <button
            onClick={() => setConsentAccepted(true)}
            className="w-full rounded-2xl bg-[#1c1c1e] py-4 text-sm font-bold text-white"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  if (!hasDemoData) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] pb-10 text-[#1c1c1e]">
        <div className="mx-auto w-full max-w-[430px]">
          <header className="px-4 pb-4 pt-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Your health data</h1>
            <p className="mt-1 text-sm text-[#3a3a3c]">Add your files to get started</p>
          </header>
          <div className="flex flex-col gap-3 px-4 mb-6">
            {[
              { key: "dna" as OnboardingInput, icon: "🧬", title: "Add DNA file",          sub: "23andMe · AncestryDNA · raw VCF" },
              { key: "blood" as OnboardingInput, icon: "🩸", title: "Add blood panel",        sub: "Lab report PDF · CSV · image" },
              { key: "medication" as OnboardingInput, icon: "💊", title: "Add medication context", sub: "Current prescriptions" },
            ].map(row => {
              const added = demoInputs[row.key];
              return (
                <button
                  key={row.title}
                  onClick={() => setDemoInputs(prev => ({ ...prev, [row.key]: true }))}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left shadow-sm transition-colors ${added ? "bg-[#34c75915]" : "bg-white"}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f4f0] text-xl">{row.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1c1c1e]">{added ? row.title.replace("Add", "Added") : row.title}</p>
                    <p className="text-xs text-[#8e8e93]">{added ? "Ready for demo results" : row.sub}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${added ? "text-[#1d8338]" : "text-[#c7c7cc]"}`}>{added ? "Added ✓" : "Tap"}</span>
                </button>
              );
            })}
          </div>
          <div className="px-4">
            <button
              onClick={loadDemoData}
              disabled={!onboardingComplete}
              className={`w-full rounded-2xl py-4 text-sm font-bold text-white transition-colors ${onboardingComplete ? "bg-[#007aff]" : "bg-[#c7c7cc]"}`}
            >
              {onboardingComplete ? "Generate demo results" : "Add all demo inputs first"}
            </button>
            <p className="mt-2 text-center text-xs text-[#8e8e93]">Tap each demo input to simulate a real first-use setup.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] text-[#1c1c1e]">
      {showSummary && (
        <DoctorSummarySheet
          vals={vals}
          panelLabel={panelLabel}
          hfeWithGenotype={hfeWithGenotype}
          checkedQuestions={checkedQuestions}
          qDiscussed={qDiscussed}
          clinicianNote={clinicianNote}
          reminderSet={reminderSet}
          dnaDeleted={dnaDeleted}
          bloodDeleted={bloodDeleted}
          onClose={() => setShowSummary(false)}
        />
      )}
      {renderDetailSheet()}

      <div className="mx-auto w-full max-w-[430px]">
        {activeTab === "results"   && renderResults()}
        {activeTab === "inputs"    && renderInputs()}
        {activeTab === "questions" && renderQuestions()}
        {activeTab === "evidence"  && renderEvidence()}
        {activeTab === "data"      && renderData()}
      </div>

      {/* 5-tab bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] justify-around px-1 pb-7 pt-2">
          {(
            [
              { id: "results",   icon: "✦", label: "Results"   },
              { id: "inputs",    icon: "＋", label: "Inputs"    },
              { id: "questions", icon: "?", label: "Prep" },
              { id: "evidence",  icon: "≡", label: "Evidence"  },
              { id: "data",      icon: "◎", label: "Data"      },
            ] as { id: Tab; icon: string; label: string }[]
          ).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 text-[10px] font-semibold transition-colors ${
                activeTab === item.id ? "text-[#007aff]" : "text-[#8e8e93]"
              }`}
            >
              <span className="text-[18px] leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
