"use client";
import { useState } from "react";
import Link from "next/link";

// ─── marker configs with clinical thresholds ──────────────────────────────────
const MARKERS = {
  apob: {
    name: "ApoB",
    unit: "mg/dL",
    optimalBelow: 80,
    borderlineBelow: 120,
    scale: 160,
    description: "Atherosclerotic risk marker",
    source: "Blood panel · May 2026",
  },
  ldl: {
    name: "LDL-C",
    unit: "mg/dL",
    optimalBelow: 100,
    borderlineBelow: 160,
    scale: 210,
    description: "Low-density lipoprotein",
    source: "Blood panel · May 2026",
  },
  hscrp: {
    name: "hs-CRP",
    unit: "mg/L",
    optimalBelow: 1.0,
    borderlineBelow: 3.0,
    scale: 7,
    description: "Systemic inflammation marker",
    source: "Blood panel · May 2026",
  },
  homocysteine: {
    name: "Homocysteine",
    unit: "µmol/L",
    optimalBelow: 15,
    borderlineBelow: 20,
    scale: 28,
    description: "Methylation pathway marker",
    source: "Blood panel · May 2026",
    lowBelow: 5,
  },
} as const;

type MarkerKey = keyof typeof MARKERS;
type Status = "low" | "optimal" | "borderline" | "high";
type DefaultValues = Record<MarkerKey, number>;

const DEFAULT_VALUES: DefaultValues = {
  apob: 125,
  ldl: 155,
  hscrp: 4.2,
  homocysteine: 7.8,
};

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

// ─── segmented range bar ──────────────────────────────────────────────────────
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

// ─── doctor summary sheet ─────────────────────────────────────────────────────
function DoctorSummarySheet({
  vals,
  panelLabel,
  onClose,
}: {
  vals: DefaultValues;
  panelLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto rounded-t-3xl bg-white px-5 pt-5 pb-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Doctor summary</h2>
          <button onClick={onClose} className="text-sm font-semibold text-[#007aff]">Done</button>
        </div>
        <div className="space-y-4 text-sm text-[#3a3a3c]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">Generated from</p>
            <p>1 DNA file · CYP2C19 *2/*2</p>
            <p>1 blood panel · {panelLabel}</p>
          </div>
          <div className="border-t border-[#e5e5ea] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">Medication note</p>
            <p>CYP2C19 *2/*2 predicts substantially reduced clopidogrel activation. Please review whether current therapy is appropriate given this result.</p>
          </div>
          <div className="border-t border-[#e5e5ea] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">Blood markers to discuss</p>
            <p>ApoB: {vals.apob} mg/dL (ref &lt;80 optimal)</p>
            <p>LDL-C: {vals.ldl} mg/dL (ref &lt;100 optimal)</p>
            <p>hs-CRP: {vals.hscrp} mg/L (ref &lt;1.0 low risk)</p>
            <p>Homocysteine: {vals.homocysteine} µmol/L (ref 5–15 normal)</p>
          </div>
          <div className="border-t border-[#e5e5ea] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">Questions to bring</p>
            <p>1. Is clopidogrel still appropriate given CYP2C19 *2/*2?</p>
            <p>2. Should ApoB and LDL-C be re-checked after a lipid review?</p>
            <p>3. Does hs-CRP elevation warrant further investigation?</p>
          </div>
          <p className="border-t border-[#e5e5ea] pt-3 text-[10px] text-[#c7c7cc]">
            HealthLens · Prototype · Not a clinical report · For discussion purposes only
          </p>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText("HealthLens summary — see app for details."); }}
          className="mt-5 w-full rounded-2xl bg-[#f5f4f0] py-3 text-sm font-semibold text-[#007aff]"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [vals, setVals] = useState<DefaultValues>(DEFAULT_VALUES);
  const [editingKey, setEditingKey] = useState<MarkerKey | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showExtraMarkers, setShowExtraMarkers] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  const [panelLabel, setPanelLabel] = useState("May 2026");
  const [panelUploaded, setPanelUploaded] = useState(false);
  const [b12, setB12] = useState("520");
  const [folate, setFolate] = useState("12.4");
  const [dataCleared, setDataCleared] = useState(false);

  function commitEdit() {
    const n = parseFloat(editDraft);
    if (!isNaN(n) && n > 0 && editingKey) {
      setVals(prev => ({ ...prev, [editingKey]: n }));
    }
    setEditingKey(null);
    setEditDraft("");
  }

  function startEdit(key: MarkerKey) {
    setEditingKey(key);
    setEditDraft(String(vals[key]));
  }

  function uploadNewerPanel() {
    setVals({ apob: 112, ldl: 138, hscrp: 2.2, homocysteine: 8.1 });
    setPanelLabel("June 2026");
    setPanelUploaded(true);
    setShowTrend(true);
    setExportReady(false);
  }

  const toggle = (id: string) => setExpandedCard(prev => prev === id ? null : id);
  const lipidSev = lipidSeverity(vals);
  const nonOptimalCount = (["apob", "ldl", "hscrp"] as MarkerKey[]).filter(k => getStatus(k, vals[k]) !== "optimal").length;

  return (
    <main className="min-h-screen bg-[#f5f4f0] pb-28 text-[#1c1c1e]">
      {showSummary && (
        <DoctorSummarySheet vals={vals} panelLabel={panelLabel} onClose={() => setShowSummary(false)} />
      )}

      <div className="mx-auto flex w-full max-w-[430px] flex-col">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between px-4 pb-4 pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Your May health check</h1>
            <p className="mt-1 text-sm text-[#3a3a3c]">
              1 to discuss · {nonOptimalCount} blood signal{nonOptimalCount !== 1 ? "s" : ""} · 1 DNA finding
            </p>
          </div>
          <Link
            href="/upload"
            className="mt-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#007aff] shadow-sm"
          >
            Edit inputs
          </Link>
        </header>

        {/* ── Summary strip ─────────────────────────────────────────────── */}
        <div className="mx-4 mb-6 grid grid-cols-3 divide-x divide-[#e5e5ea] overflow-hidden rounded-2xl bg-white shadow-sm">
          <button onClick={() => toggle("med")} className="px-3 py-3.5 text-left">
            <p className="text-[22px] font-bold tabular-nums leading-none text-[#ff3b30]">1</p>
            <p className="mt-1 text-[11px] font-semibold text-[#1c1c1e]">Discuss</p>
            <p className="text-[10px] text-[#8e8e93]">with clinician</p>
          </button>
          <button onClick={() => toggle("lipid")} className="px-3 py-3.5 text-left">
            <p className="text-[22px] font-bold tabular-nums leading-none text-[#ff9500]">{nonOptimalCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#1c1c1e]">Blood signals</p>
            <p className="text-[10px] text-[#8e8e93]">outside optimal</p>
          </button>
          <button onClick={() => toggle("methyl")} className="px-3 py-3.5 text-left">
            <p className="text-[22px] font-bold tabular-nums leading-none text-[#34c759]">1</p>
            <p className="mt-1 text-[11px] font-semibold text-[#1c1c1e]">Reassuring</p>
            <p className="text-[10px] text-[#8e8e93]">no active flag</p>
          </button>
        </div>

        {/* ── What matters now ──────────────────────────────────────────── */}
        <SectionLabel>What matters now</SectionLabel>
        <div className="mb-6 flex flex-col gap-3 px-4">

          {/* Card 1 — Important: CYP2C19 × clopidogrel */}
          <article className="overflow-hidden rounded-2xl shadow-[0_2px_16px_rgba(255,59,48,0.12)]">
            <button
              className="flex w-full items-start gap-3 bg-[#ff3b30] px-4 pb-4 pt-4 text-left"
              onClick={() => toggle("med")}
            >
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffb3af]">
                  Important · DNA-driven
                </p>
                <h3 className="mt-0.5 text-[17px] font-bold leading-snug text-white">
                  Discuss clopidogrel with your prescribing clinician
                </h3>
                <p className="mt-1 text-xs text-white/70">CYP2C19 *2/*2 · Poor Metabolizer</p>
              </div>
              <ChevronIcon open={expandedCard === "med"} light />
            </button>

            {expandedCard === "med" && (
              <div className="bg-white px-4 py-4 space-y-4">
                <p className="text-sm leading-6 text-[#3a3a3c]">
                  Your CYP2C19 result (*2/*2, Poor Metabolizer) suggests substantially reduced ability to activate clopidogrel. This is clinically relevant if you are currently taking it for a cardiovascular indication.
                </p>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Evidence trace</p>
                  <div className="divide-y divide-[#f0ede8]">
                    <EvidenceRow n={1} text="CYP2C19 *2/*2 → Poor Metabolizer (CPIC diplotype table)" />
                    <EvidenceRow n={2} text="Poor Metabolizer + clopidogrel → strong CPIC alert" />
                    <EvidenceRow n={3} text="Clopidogrel listed as current medication in your data" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions for your clinician</p>
                  <div className="space-y-2">
                    <QuestionRow text="Is clopidogrel still appropriate given my CYP2C19 result?" />
                    <QuestionRow text="Should I be considered for an alternative antiplatelet therapy?" />
                    <QuestionRow text="Does my specific indication change the clinical approach here?" />
                  </div>
                </div>

                <p className="text-[11px] text-[#c7c7cc]">Source: CPIC 2022 · PMID 35034351</p>
                <p className="border-t border-[#f0ede8] pt-3 text-[11px] text-[#8e8e93]">
                  Do not start, stop, or change medication based on this result. Bring it to your prescribing clinician.
                </p>
              </div>
            )}
          </article>

          {/* Card 2 — Monitor: Blood-first signal */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <button
              className="flex w-full items-start gap-3 px-4 py-4 text-left"
              onClick={() => toggle("lipid")}
            >
              <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff9500]" />
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff9500]">
                  Monitor · Blood-first signal
                </p>
                <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
                  {lipidSev === "monitor"
                    ? "ApoB and LDL-C above optimal — worth discussing"
                    : "Lipid values in borderline range — worth tracking"}
                </h3>
                <p className="mt-0.5 text-xs text-[#8e8e93]">
                  ApoB {vals.apob} · LDL-C {vals.ldl} · hs-CRP {vals.hscrp}
                </p>
              </div>
              <ChevronIcon open={expandedCard === "lipid"} />
            </button>

            {expandedCard === "lipid" && (
              <div className="border-t border-[#f0ede8] px-4 py-4 space-y-4">
                <p className="text-sm leading-6 text-[#3a3a3c]">
                  Your blood test is the primary signal here. ApoB and LDL-C reflect current lipid burden, while hs-CRP adds an inflammation signal. DNA context does not drive this interpretation.
                </p>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Marker detail</p>
                  <div className="space-y-3">
                    {(["apob", "ldl", "hscrp"] as MarkerKey[]).map(k => {
                      const cfg = MARKERS[k];
                      const status = getStatus(k, vals[k]);
                      const colors = statusColors(status);
                      return (
                        <div key={k}>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold">{cfg.name}</span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-[20px] font-bold tabular-nums leading-none ${colors.value}`}>{vals[k]}</span>
                              <span className="text-xs text-[#8e8e93]">{cfg.unit}</span>
                              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
                                {getStatusLabel(status, k)}
                              </span>
                            </div>
                          </div>
                          <SegmentedBar value={vals[k]} markerKey={k} />
                          <p className="mt-0.5 text-[10px] text-[#c7c7cc]">
                            Optimal &lt;{cfg.optimalBelow} · Borderline {cfg.optimalBelow}–{cfg.borderlineBelow - 1} · High ≥{cfg.borderlineBelow}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions for your clinician</p>
                  <div className="space-y-1.5">
                    <QuestionRow text="Should ApoB be retested after a lifestyle or medication review?" />
                    <QuestionRow text="Is hs-CRP elevation worth investigating further?" />
                  </div>
                </div>
                <button
                  onClick={() => setShowSummary(true)}
                  className="flex w-full items-center gap-2 py-1 text-sm font-semibold text-[#007aff]"
                >
                  <span>📋</span> Preview doctor summary
                </button>
              </div>
            )}
          </article>

          {/* Card 3 — Reassuring: Not currently reflected */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <button
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              onClick={() => toggle("methyl")}
            >
              <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#34c759]" />
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#34c759]">
                  Reassuring · Not currently reflected
                </p>
                <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
                  MTHFR variant · homocysteine {vals.homocysteine} µmol/L — normal
                </h3>
              </div>
              <ChevronIcon open={expandedCard === "methyl"} />
            </button>

            {expandedCard === "methyl" && (
              <div className="border-t border-[#f0ede8] px-4 py-4 space-y-3">
                <p className="text-sm leading-6 text-[#3a3a3c]">
                  An MTHFR variant appears in your DNA file. Your homocysteine ({vals.homocysteine} µmol/L) is within the normal range (5–15 µmol/L), so no active methylation concern is currently flagged.
                </p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Evidence trace</p>
                  <div className="divide-y divide-[#f0ede8]">
                    <EvidenceRow n={1} text="MTHFR variant identified in DNA file" />
                    <EvidenceRow n={2} text={`Homocysteine ${vals.homocysteine} µmol/L — within normal range (5–15)`} />
                  </div>
                </div>
                <p className="text-xs text-[#8e8e93]">
                  Adding B12 or folate values here would give more context to this pathway.
                </p>
                {showExtraMarkers ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-semibold text-[#8e8e93]">
                        B12
                        <input
                          type="number"
                          value={b12}
                          onChange={e => setB12(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-[#f5f4f0] px-3 py-2 text-sm font-bold text-[#1c1c1e] focus:outline-none"
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#8e8e93]">
                        Folate
                        <input
                          type="number"
                          value={folate}
                          onChange={e => setFolate(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-[#f5f4f0] px-3 py-2 text-sm font-bold text-[#1c1c1e] focus:outline-none"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-[#c7c7cc]">B12 {b12} pg/mL · Folate {folate} ng/mL — context only</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowExtraMarkers(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#007aff]"
                  >
                    <span>＋</span> Add B12 / folate
                  </button>
                )}
              </div>
            )}
          </article>
        </div>

        {/* ── DNA × blood ───────────────────────────────────────────────── */}
        <SectionLabel>DNA × blood</SectionLabel>
        <div className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <RelRow
              label="CYP2C19 *2/*2"
              tag="DNA-driven"
              tagColor="text-[#007aff]"
              desc="Predicts reduced clopidogrel activation. Blood markers do not confirm or deny this — it is a genetic trait."
            />
            <RelRow
              label="ApoB · LDL-C · hs-CRP"
              tag="Blood-first signal"
              tagColor="text-[#ff9500]"
              desc="Current cardiovascular signal from lipid burden and inflammation. No genetic variant drives this interpretation."
            />
            <RelRow
              label="MTHFR + homocysteine"
              tag="Context only"
              tagColor="text-[#34c759]"
              desc="MTHFR variant is present in DNA, but homocysteine is normal. Blood result normalises the genetic signal here."
            />
          </div>
        </div>

        {/* ── Current blood signals ─────────────────────────────────────── */}
        <SectionLabel>Current blood signals</SectionLabel>
        <section className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
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
                          autoFocus
                          type="number"
                          step="0.1"
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === "Enter" && commitEdit()}
                          className="w-20 text-right text-[20px] font-bold tabular-nums text-[#007aff] focus:outline-none bg-transparent"
                        />
                      ) : (
                        <span className={`text-[20px] font-bold tabular-nums leading-none ${colors.value}`}>
                          {vals[k]}
                        </span>
                      )}
                      <span className="text-xs text-[#8e8e93]">{cfg.unit}</span>
                      {!isEditing && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
                          {getStatusLabel(status, k)}
                        </span>
                      )}
                    </div>
                  </div>
                  <SegmentedBar value={vals[k]} markerKey={k} />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-[#c7c7cc]">
                      {k === "homocysteine"
                        ? "Normal 5–15 µmol/L"
                        : `Optimal <${cfg.optimalBelow} · High ≥${cfg.borderlineBelow}`}
                    </p>
                    {isEditing ? (
                      <button onClick={commitEdit} className="text-[11px] font-semibold text-[#007aff]">Update</button>
                    ) : (
                      <button onClick={() => startEdit(k)} className="text-[11px] font-semibold text-[#007aff]">Edit</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!showExtraMarkers && (
            <div className="border-t border-[#f0ede8] px-4 py-3">
              <button
                onClick={() => setShowExtraMarkers(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#007aff]"
              >
                <span>＋</span> Add optional marker (B12, folate)
              </button>
            </div>
          )}
        </section>

        {/* ── Questions for your clinician ──────────────────────────────── */}
        <SectionLabel>Questions for your clinician</SectionLabel>
        <section className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <ClinicalQuestion n={1} text="Is clopidogrel still appropriate given my CYP2C19 *2/*2 result?" tag="Medication" />
            <ClinicalQuestion n={2} text="Should an alternative antiplatelet be considered given my genotype?" tag="Medication" />
            <ClinicalQuestion n={3} text={`My ApoB is ${vals.apob} mg/dL — should this trigger a lipid review?`} tag="Blood" />
            <ClinicalQuestion n={4} text="Is my hs-CRP elevation worth investigating further, or is it incidental?" tag="Blood" />
            <ClinicalQuestion n={5} text="MTHFR is in my DNA — does this matter if my homocysteine is normal?" tag="DNA" />
          </div>
          <div className="border-t border-[#f0ede8] px-4 py-3">
            <button
              onClick={() => setShowSummary(true)}
              className="flex w-full items-center justify-between text-sm font-semibold text-[#007aff]"
            >
              <span>Open full doctor summary</span>
              <span>›</span>
            </button>
          </div>
        </section>

        {/* ── Evidence trace ────────────────────────────────────────────── */}
        <SectionLabel>Evidence trace</SectionLabel>
        <section className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <TraceRow label="DNA file" value="CYP2C19 · MTHFR · APOE" />
            <TraceRow label="CYP2C19 diplotype" value="*2/*2 → Poor Metabolizer" />
            <TraceRow label="Drug flag source" value="CPIC 2022 · PMID 35034351" />
            <TraceRow label="Blood panel" value={`${panelLabel} · ApoB · LDL-C · hs-CRP · Homocysteine`} />
            <TraceRow label="Reference population" value="NHANES adult reference ranges" />
            <TraceRow label="Wording" value="AI-assisted · not medical evidence" />
          </div>
        </section>

        {/* ── What this does not mean ───────────────────────────────────── */}
        <SectionLabel>What this does not mean</SectionLabel>
        <div className="mx-4 mb-6 overflow-hidden rounded-2xl border border-[#f0dfa0] bg-[#fffbef] px-4 py-4 shadow-sm">
          <div className="space-y-2.5">
            <DoesNotRow text="A diagnosis of any condition" />
            <DoesNotRow text="A reason to start, stop, or change any medication" />
            <DoesNotRow text="Proof that your DNA causes your blood results" />
            <DoesNotRow text="A substitute for clinical consultation" />
            <DoesNotRow text="Evidence of disease risk for your specific situation" />
          </div>
          <p className="mt-3 text-[11px] text-[#9a7c00]">
            AI is used for wording only. Medical evidence comes from CPIC and NHANES reference data.
          </p>
        </div>

        {/* ── Data controls ─────────────────────────────────────────────── */}
        <SectionLabel>Data controls</SectionLabel>
        <section className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#f0ede8]">
            <ActionBtn label="Preview doctor summary" right="›" onClick={() => setShowSummary(true)} />
            <ActionBtn
              label="Upload newer blood panel"
              right={panelUploaded ? "Loaded ✓" : "›"}
              onClick={uploadNewerPanel}
            />
            <ActionBtn
              label="Compare with previous test"
              right={showTrend ? "Hide" : "›"}
              onClick={() => setShowTrend(prev => !prev)}
            />
            {showTrend && (
              <div className="border-t border-[#f0ede8] px-4 py-3 text-sm text-[#3a3a3c]">
                <p>ApoB changed from 118 to {vals.apob} mg/dL.</p>
                <p className="mt-1 text-xs text-[#8e8e93]">
                  {vals.apob > 118 ? "Increased since last panel." : "Improved since last panel."}
                </p>
              </div>
            )}
            <ActionBtn
              label="Export PDF"
              right={exportReady ? "Ready ✓" : "›"}
              onClick={() => setExportReady(true)}
            />
            <Link href="/upload" className="flex w-full items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Edit input data</span>
              <span className="text-[#c7c7cc]">›</span>
            </Link>
            <button
              onClick={() => setDataCleared(true)}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <span className={`text-sm font-semibold ${dataCleared ? "text-[#8e8e93]" : "text-[#ff3b30]"}`}>
                {dataCleared ? "Data cleared (prototype)" : "Clear all data"}
              </span>
              <span className="text-[#c7c7cc]">›</span>
            </button>
          </div>
        </section>

        {/* ── Safety footer ─────────────────────────────────────────────── */}
        <p className="mb-8 px-4 text-center text-[11px] text-[#c7c7cc]">
          HealthLens helps you prepare questions for your clinician. Not a diagnosis.
        </p>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5ea] bg-white/95 px-5 pb-8 pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] justify-around">
          <BottomItem href="/" icon="✦" label="Results" active />
          <BottomItem href="/blood" icon="🩸" label="Blood" />
          <BottomItem href="/dna" icon="🧬" label="DNA" />
          <BottomItem href="/pgx" icon="💊" label="PGx" />
        </div>
      </nav>
    </main>
  );
}

// ─── small components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">{children}</p>
  );
}

function ChevronIcon({ open, light = false }: { open: boolean; light?: boolean }) {
  return (
    <svg
      className={`mt-1.5 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${light ? "text-white/60" : "text-[#c7c7cc]"}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RelRow({
  label,
  tag,
  tagColor,
  desc,
}: {
  label: string;
  tag: string;
  tagColor: string;
  desc: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#1c1c1e]">{label}</span>
        <span className={`text-[10px] font-semibold ${tagColor}`}>{tag}</span>
      </div>
      <p className="mt-0.5 text-xs leading-5 text-[#8e8e93]">{desc}</p>
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

function QuestionRow({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-sm leading-5 text-[#3a3a3c]">
      <span className="mt-0.5 shrink-0 text-[#c7c7cc]">·</span>
      {text}
    </p>
  );
}

function ClinicalQuestion({ n, text, tag }: { n: number; text: string; tag: string }) {
  const tagColors: Record<string, string> = {
    Medication: "bg-[#ff3b3015] text-[#d32f2f]",
    Blood:      "bg-[#ff950015] text-[#b36200]",
    DNA:        "bg-[#007aff15] text-[#0055b3]",
  };
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="w-4 shrink-0 mt-0.5 text-xs font-bold tabular-nums text-[#c7c7cc]">{n}</span>
      <p className="flex-1 text-sm leading-5 text-[#3a3a3c]">{text}</p>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagColors[tag]}`}>{tag}</span>
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

function DoesNotRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-sm text-[#c4a840]">×</span>
      <p className="text-sm text-[#7c5a00]">{text}</p>
    </div>
  );
}

function ActionBtn({
  label,
  right,
  onClick,
}: {
  label: string;
  right: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-4 py-3.5">
      <span className="text-sm font-semibold text-[#1c1c1e]">{label}</span>
      <span className="text-xs text-[#c7c7cc]">{right}</span>
    </button>
  );
}

function BottomItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${active ? "text-[#007aff]" : "text-[#8e8e93]"}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
