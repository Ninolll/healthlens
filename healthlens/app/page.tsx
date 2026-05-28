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
    case "optimal":   return { text: "text-[#1c1c1e]",  value: "text-[#1c1c1e]",  badge: "bg-[#34c75920] text-[#1d8338]",  dot: "bg-[#34c759]" };
    case "borderline":return { text: "text-[#1c1c1e]",  value: "text-[#ff9500]",  badge: "bg-[#ff950020] text-[#b36200]",  dot: "bg-[#ff9500]" };
    case "high":      return { text: "text-[#1c1c1e]",  value: "text-[#ff3b30]",  badge: "bg-[#ff3b3020] text-[#d32f2f]",  dot: "bg-[#ff3b30]" };
    case "low":       return { text: "text-[#1c1c1e]",  value: "text-[#007aff]",  badge: "bg-[#007aff20] text-[#0055b3]",  dot: "bg-[#007aff]" };
  }
}

// ─── derive lipid card severity from live marker values ───────────────────────
function lipidSeverity(vals: DefaultValues): "discuss" | "monitor" | "watch" {
  const statuses = [getStatus("apob", vals.apob), getStatus("ldl", vals.ldl), getStatus("hscrp", vals.hscrp)];
  if (statuses.some(s => s === "high")) return "monitor";
  if (statuses.some(s => s === "borderline")) return "watch";
  return "watch";
}

// ─── segmented range bar ──────────────────────────────────────────────────────
function SegmentedBar({ value, cfg }: { value: number; cfg: typeof MARKERS[MarkerKey] }) {
  const scale = Math.max(cfg.scale, value * 1.1);
  const optPct   = (cfg.optimalBelow   / scale) * 100;
  const borderW  = ((cfg.borderlineBelow - cfg.optimalBelow) / scale) * 100;
  const highW    = 100 - optPct - borderW;
  const dotPct   = Math.min((value / scale) * 100, 97);

  return (
    <div className="relative mt-1.5">
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-[#34c75950]" style={{ width: `${optPct}%` }} />
        <div className="bg-[#ff950050]" style={{ width: `${borderW}%` }} />
        <div className="bg-[#ff3b3050]" style={{ width: `${highW}%` }} />
      </div>
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${dotPct}%`,
          backgroundColor:
            getStatus(Object.keys(MARKERS).find(k => MARKERS[k as MarkerKey] === cfg) as MarkerKey, value) === "high"
              ? "#ff3b30"
              : getStatus(Object.keys(MARKERS).find(k => MARKERS[k as MarkerKey] === cfg) as MarkerKey, value) === "borderline"
              ? "#ff9500"
              : "#34c759",
        }}
      />
    </div>
  );
}

// ─── doctor summary sheet content ─────────────────────────────────────────────
function DoctorSummarySheet({ vals, onClose }: { vals: DefaultValues; onClose: () => void }) {
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
            <p>1 blood panel · May 2026</p>
          </div>

          <div className="border-t border-[#e5e5ea] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">Medication note</p>
            <p>CYP2C19 *2/*2 predicts substantially reduced activation of clopidogrel. Please review whether current dosing is appropriate given this result.</p>
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
            <p>2. Should ApoB and LDL-C be re-checked after lipid intervention?</p>
            <p>3. Does hs-CRP warrant further investigation?</p>
          </div>

          <p className="border-t border-[#e5e5ea] pt-3 text-[10px] text-[#c7c7cc]">
            HealthLens · Prototype · Not a clinical report · For discussion purposes only
          </p>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText("HealthLens summary — see app for details.");
          }}
          className="mt-5 w-full rounded-2xl bg-[#f2f2f7] py-3 text-sm font-semibold text-[#007aff]"
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

  const toggle = (id: string) => setExpandedCard(prev => prev === id ? null : id);
  const lipidSev = lipidSeverity(vals);

  return (
    <main className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      {showSummary && <DoctorSummarySheet vals={vals} onClose={() => setShowSummary(false)} />}
      <div className="mx-auto flex w-full max-w-[430px] flex-col">

        {/* ── Header ────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 pb-3 pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">HealthLens</p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">Your May health check</h1>
            <p className="mt-0.5 text-xs text-[#8e8e93]">3 results · 1 DNA file · 1 blood panel</p>
          </div>
          <Link href="/upload" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#007aff] shadow-sm">
            Edit inputs
          </Link>
        </header>

        {/* ── Summary strip ─────────────────────────────────────────── */}
        <div className="mx-4 mb-5 grid grid-cols-3 divide-x divide-[#e5e5ea] overflow-hidden rounded-2xl bg-white shadow-sm">
          <button onClick={() => toggle("med")} className="px-3 py-3 text-left">
            <p className="text-[20px] font-bold tabular-nums">1</p>
            <p className="text-[11px] font-semibold text-[#1c1c1e]">Medication</p>
            <p className="text-[10px] text-[#8e8e93]">review needed</p>
          </button>
          <button onClick={() => toggle("lipid")} className="px-3 py-3 text-left">
            <p className="text-[20px] font-bold tabular-nums">
              {[getStatus("apob", vals.apob), getStatus("ldl", vals.ldl), getStatus("hscrp", vals.hscrp)].filter(s => s !== "optimal").length}
            </p>
            <p className="text-[11px] font-semibold text-[#1c1c1e]">Lipid markers</p>
            <p className="text-[10px] text-[#8e8e93]">outside optimal</p>
          </button>
          <button onClick={() => toggle("methyl")} className="px-3 py-3 text-left">
            <p className="text-[20px] font-bold tabular-nums">1</p>
            <p className="text-[11px] font-semibold text-[#1c1c1e]">DNA finding</p>
            <p className="text-[10px] text-[#8e8e93]">no active flag</p>
          </button>
        </div>

        {/* ── Result cards ──────────────────────────────────────────── */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Your results</p>
        <div className="mb-5 flex flex-col gap-3 px-4">

          {/* Card 1 — Medication review */}
          <article className="overflow-hidden rounded-2xl shadow-[0_2px_16px_rgba(255,59,48,0.15)]">
            <button
              className="flex w-full items-start gap-3 bg-[#ff3b30] px-4 pb-4 pt-4 text-left"
              onClick={() => toggle("med")}
            >
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffb3af]">Medication review</p>
                <h3 className="mt-0.5 text-[17px] font-bold leading-snug text-white">
                  Discuss clopidogrel with your clinician
                </h3>
                <p className="mt-1 text-xs text-white/70">Data used: CYP2C19 *2/*2 · clopidogrel</p>
              </div>
              <ChevronIcon open={expandedCard === "med"} />
            </button>

            {expandedCard === "med" && (
              <div className="bg-white px-4 py-4 space-y-4">
                <p className="text-sm leading-5 text-[#3a3a3c]">
                  Your CYP2C19 result (*2/*2, Poor Metabolizer) suggests substantially reduced ability to activate clopidogrel. This is clinically relevant if you are taking it for a cardiovascular indication.
                </p>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Why this was flagged</p>
                  <div className="divide-y divide-[#e5e5ea]">
                    <EvidenceRow n={1} text="CYP2C19 *2/*2 → Poor Metabolizer (CPIC diplotype table)" />
                    <EvidenceRow n={2} text="Poor Metabolizer + clopidogrel → strong CPIC alert" />
                    <EvidenceRow n={3} text="Clopidogrel listed as current medication" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Questions to prepare</p>
                  <div className="space-y-1.5">
                    <ActionRow text="Is clopidogrel still appropriate given my CYP2C19 result?" />
                    <ActionRow text="Should I be considered for an alternative antiplatelet therapy?" />
                    <ActionRow text="Does my indication change the clinical approach here?" />
                  </div>
                </div>

                <p className="text-[11px] text-[#c7c7cc]">Source: CPIC 2022 · PMID 35034351</p>
                <p className="text-[11px] text-[#8e8e93]">Medication decisions should be reviewed with your prescribing clinician.</p>
              </div>
            )}
          </article>

          {/* Card 2 — Lipid follow-up */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <button
              className="flex w-full items-start gap-3 px-4 py-4 text-left"
              onClick={() => toggle("lipid")}
            >
              <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff9500] mt-2" />
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff9500]">
                  {lipidSev === "monitor" ? "Lipid follow-up" : "Lipid watch"}
                </p>
                <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
                  {lipidSev === "monitor"
                    ? "ApoB and LDL-C above optimal — worth tracking"
                    : "Lipid values within borderline range"}
                </h3>
                <p className="mt-0.5 text-xs text-[#8e8e93]">
                  Data used: ApoB {vals.apob} · LDL-C {vals.ldl} · hs-CRP {vals.hscrp}
                </p>
              </div>
              <ChevronIcon open={expandedCard === "lipid"} />
            </button>

            {expandedCard === "lipid" && (
              <div className="border-t border-[#e5e5ea] px-4 py-4 space-y-4">
                <p className="text-sm leading-5 text-[#3a3a3c]">
                  Your blood test is the primary signal here. ApoB and LDL-C reflect current cardiovascular risk from lipid burden. hs-CRP adds inflammation context.
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
                          <SegmentedBar value={vals[k]} cfg={cfg} />
                          <p className="mt-0.5 text-[10px] text-[#c7c7cc]">
                            Optimal &lt;{cfg.optimalBelow} · Borderline {cfg.optimalBelow}–{cfg.borderlineBelow - 1} · High ≥{cfg.borderlineBelow}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Actions</p>
                  <div className="space-y-1">
                    <ActionRow text="Track — add a follow-up test date" />
                    <ActionRow text="Ask about statin or lifestyle review" />
                    <button onClick={() => setShowSummary(true)} className="flex w-full items-center gap-2 py-1.5 text-sm font-semibold text-[#007aff]">
                      <span className="text-base">📋</span> Preview doctor summary
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Card 3 — Methylation check */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <button
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              onClick={() => toggle("methyl")}
            >
              <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#34c759]" />
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#34c759]">No active flag</p>
                <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
                  MTHFR variant · homocysteine {vals.homocysteine} µmol/L — normal
                </h3>
              </div>
              <ChevronIcon open={expandedCard === "methyl"} />
            </button>

            {expandedCard === "methyl" && (
              <div className="border-t border-[#e5e5ea] px-4 py-4 space-y-3">
                <p className="text-sm leading-5 text-[#3a3a3c]">
                  An MTHFR variant appears in your DNA file. Your homocysteine ({vals.homocysteine} µmol/L) is within the normal range (5–15 µmol/L), so no active methylation concern is flagged.
                </p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Data used</p>
                  <EvidenceRow n={1} text="MTHFR variant present in DNA file" />
                  <EvidenceRow n={2} text={`Homocysteine ${vals.homocysteine} µmol/L — within normal range`} />
                </div>
                <p className="text-xs text-[#8e8e93]">
                  If you have B12 or folate results, adding them here would give more context.
                </p>
                <button className="flex items-center gap-1.5 text-sm font-semibold text-[#007aff]">
                  <span>＋</span> Add B12 / folate value
                </button>
              </div>
            )}
          </article>
        </div>

        {/* ── Blood values (interactive) ─────────────────────────────── */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Blood values</p>
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
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
                  <SegmentedBar value={vals[k]} cfg={cfg} />
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
          <div className="border-t border-[#e5e5ea] px-4 py-3">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-[#007aff]">
              <span>＋</span> Add missing marker
            </button>
          </div>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Actions</p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            <button
              onClick={() => setShowSummary(true)}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <span className="text-sm font-semibold text-[#1c1c1e]">Preview doctor summary</span>
              <span className="text-[#c7c7cc]">›</span>
            </button>
            <Link href="/upload" className="flex w-full items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Upload newer panel</span>
              <span className="text-[#c7c7cc]">›</span>
            </Link>
            <button className="flex w-full items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Compare with previous test</span>
              <span className="text-xs text-[#c7c7cc]">Coming soon</span>
            </button>
            <button className="flex w-full items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#1c1c1e]">Export PDF</span>
              <span className="text-[#c7c7cc]">›</span>
            </button>
          </div>
        </section>

        {/* ── Minimal safety footer ──────────────────────────────────── */}
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`mt-1.5 h-4 w-4 shrink-0 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function ActionRow({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-sm text-[#3a3a3c]">
      <span className="mt-0.5 text-[#c7c7cc]">·</span>{text}
    </p>
  );
}

function BottomItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
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
