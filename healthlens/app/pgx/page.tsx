"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Indication = "acs_pci" | "neurovascular" | "stable_cad";

const phenotypeMap: Record<string, string> = {
  "*1/*1": "Normal Metabolizer",
  "*1/*2": "Intermediate Metabolizer",
  "*1/*3": "Intermediate Metabolizer",
  "*1/*17": "Rapid Metabolizer",
  "*2/*2": "Poor Metabolizer",
  "*2/*3": "Poor Metabolizer",
  "*17/*17": "Ultrarapid Metabolizer",
};

const indicationLabels: Record<Indication, string> = {
  acs_pci: "ACS/PCI",
  neurovascular: "Stroke/TIA",
  stable_cad: "Stable CAD",
};

const statusConfig: Record<
  string,
  { chip: string; label: string; border: string; recBorder: string }
> = {
  caution: {
    chip: "bg-[#f8f1e6] text-[#8a6334]",
    label: "⚠️ Caution",
    border: "border-[#ead7bd]",
    recBorder: "border-l-[#c79b5b]",
  },
  danger: {
    chip: "bg-[#fceeee] text-[#9d3f3f]",
    label: "⛔ High Risk",
    border: "border-[#efcaca]",
    recBorder: "border-l-[#c76d6d]",
  },
  safe: {
    chip: "bg-[#eef7f4] text-[#347b73]",
    label: "✓ Safe",
    border: "border-[#c8ded8]",
    recBorder: "border-l-[#6ba79e]",
  },
  unknown: {
    chip: "bg-[#eef1ef] text-slate-500",
    label: "No Data",
    border: "border-[#dfe8e3]",
    recBorder: "border-l-[#b9c5c0]",
  },
};

function getRecommendation(
  diplotype: string,
  drug: string,
  indication: Indication,
) {
  const phenotype = phenotypeMap[diplotype] || "Indeterminate";

  if (drug !== "Clopidogrel" || phenotype === "Indeterminate") {
    return {
      name: drug,
      gene: `CYP2C19 · ${phenotype}`,
      status: "unknown",
      recommendation:
        "No guideline currently covers this exact gene × drug query. This does not mean there is no interaction — it means evidence is insufficient for a recommendation.",
      alternatives: [],
      evidence: [
        "CPIC record: not found",
        "PharmGKB fallback: not enabled in v1",
        "Action: consult clinician or pharmacist",
      ],
      badge: "Tier 3 · No data",
    };
  }

  if (phenotype === "Poor Metabolizer") {
    const neurovascular = indication === "neurovascular";
    return {
      name: "Clopidogrel",
      gene: `CYP2C19 · ${phenotype}`,
      status: "danger",
      recommendation: neurovascular
        ? "Avoid clopidogrel if possible. Prasugrel is contraindicated in stroke/TIA patients, so use ticagrelor or ticlopidine instead."
        : "Avoid clopidogrel if possible. Your CYP2C19 genotype predicts substantially reduced active metabolite formation.",
      alternatives: neurovascular
        ? ["Ticagrelor", "Ticlopidine"]
        : ["Ticagrelor", "Prasugrel"],
      evidence: [
        `${diplotype} → Poor Metabolizer`,
        `Exact lookup: CYP2C19 + Poor Metabolizer + clopidogrel + ${indicationLabels[indication]}`,
        "Rule: Poor Metabolizer + Strong CPIC record → high alert",
      ],
      badge: "CPIC 2022 · PMID 35034351",
    };
  }

  if (phenotype === "Intermediate Metabolizer") {
    return {
      name: "Clopidogrel",
      gene: `CYP2C19 · ${phenotype}`,
      status: "caution",
      recommendation:
        "Reduced efficacy is expected. Consider an alternative antiplatelet because clopidogrel activation may be reduced.",
      alternatives: ["Ticagrelor", "Prasugrel"],
      evidence: [
        `${diplotype} → Intermediate Metabolizer`,
        `Exact lookup: CYP2C19 + Intermediate Metabolizer + clopidogrel + ${indicationLabels[indication]}`,
        "Rule: Intermediate Metabolizer → moderate alert",
      ],
      badge: "CPIC 2022 · PMID 35034351",
    };
  }

  return {
    name: "Clopidogrel",
    gene: `CYP2C19 · ${phenotype}`,
    status: "safe",
    recommendation:
      "No pharmacogenomic change is required. Standard clopidogrel use is supported for this phenotype.",
    alternatives: [],
    evidence: [
      `${diplotype} → ${phenotype}`,
      `Exact lookup: CYP2C19 + ${phenotype} + clopidogrel + ${indicationLabels[indication]}`,
      "Rule: Normal/Rapid/Ultrarapid phenotype → low alert",
    ],
    badge: "CPIC 2022 · PMID 35034351",
  };
}

export default function PgxPage() {
  const [diplotype, setDiplotype] = useState("*2/*2");
  const [drug, setDrug] = useState("Clopidogrel");
  const [indication, setIndication] = useState<Indication>("acs_pci");
  const [submitted, setSubmitted] = useState(false);
  const [analysing, setAnalysing] = useState(false);

  const result = useMemo(
    () => getRecommendation(diplotype, drug, indication),
    [diplotype, drug, indication],
  );

  function handleSubmit() {
    setAnalysing(true);
    setTimeout(() => {
      setAnalysing(false);
      setSubmitted(true);
    }, 700);
  }

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Drug Safety
          </p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Medication
            <br />
            Compatibility
          </h1>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-[1.75rem] border border-[#dfe8e3] shadow-[0_8px_22px_rgba(45,65,59,0.05)] p-5">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Run PGx safety check
            </p>
            <p className="text-xs text-slate-400 mb-4">
              CPIC lookup uses exact metadata, not RAG
            </p>

            <div className="space-y-3 mb-4">
              <label>
                <span className="text-xs text-slate-400 font-medium mb-1 block">
                  CYP2C19 diplotype
                </span>
                <select
                  value={diplotype}
                  onChange={(e) => setDiplotype(e.target.value)}
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                >
                  {Object.keys(phenotypeMap).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                  <option>Unknown</option>
                </select>
              </label>

              <label>
                <span className="text-xs text-slate-400 font-medium mb-1 block">
                  Current medication
                </span>
                <select
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                >
                  <option>Clopidogrel</option>
                  <option>Warfarin</option>
                  <option>Codeine</option>
                </select>
              </label>

              <label>
                <span className="text-xs text-slate-400 font-medium mb-1 block">
                  Clinical indication
                </span>
                <select
                  value={indication}
                  onChange={(e) => setIndication(e.target.value as Indication)}
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                >
                  <option value="acs_pci">ACS/PCI</option>
                  <option value="neurovascular">Stroke/TIA</option>
                  <option value="stable_cad">Stable CAD</option>
                </select>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={analysing}
              className="w-full py-3 bg-[#347b73] text-white rounded-[1.25rem] font-semibold text-sm disabled:opacity-40 hover:bg-[#286961] transition-colors"
            >
              {analysing ? "Checking compatibility..." : "Check Drug Safety →"}
            </button>
          </div>
        ) : (
          <>
            <div
              className={`${
                result.status === "danger"
                  ? "bg-[#fceeee] border-[#efcaca]"
                  : result.status === "caution"
                    ? "bg-[#f8f1e6] border-[#ead7bd]"
                    : "bg-[#eef7f4] border-[#c8ded8]"
              } border rounded-[1.75rem] p-4 mb-5`}
            >
              <p className="text-sm font-bold text-slate-800">
                {result.status === "danger"
                  ? "⛔ High Alert Found"
                  : result.status === "caution"
                    ? "⚠️ Caution Found"
                    : result.status === "unknown"
                      ? "No Guideline Found"
                      : "✓ Standard Use Supported"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Based on {diplotype} and {indicationLabels[indication]}
              </p>
            </div>

            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">
              Recommendation
            </p>
            <div
              className={`bg-white border ${
                statusConfig[result.status].border
              } rounded-[1.75rem] p-4 shadow-[0_8px_22px_rgba(45,65,59,0.05)]`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {result.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{result.gene}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusConfig[result.status].chip
                  }`}
                >
                  {statusConfig[result.status].label}
                </span>
              </div>
              <div
                className={`text-xs text-slate-500 leading-relaxed p-3 bg-[#f8faf8] rounded-2xl border-l-2 ${
                  statusConfig[result.status].recBorder
                } mb-3`}
              >
                {result.recommendation}
              </div>

              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Evidence trace
                </p>
                <div className="space-y-1.5">
                  {result.evidence.map((item) => (
                    <p
                      key={item}
                      className="text-[11px] text-slate-500 leading-relaxed"
                    >
                      • {item}
                    </p>
                  ))}
                </div>
              </div>

              {result.alternatives.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Suggested alternatives
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {result.alternatives.map((a) => (
                      <span
                        key={a}
                        className="text-xs px-3 py-1 bg-[#eef7f4] text-[#347b73] border border-[#c8ded8] rounded-full font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-300 mt-3">{result.badge}</p>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full mt-4 py-3 border border-[#dfe8e3] text-slate-500 rounded-[1.25rem] text-sm font-medium hover:bg-white transition-colors"
            >
              ← Enter new query
            </button>

            <p className="text-[10px] text-slate-300 text-center mt-3">
              Source: CPIC Guidelines 2022 · Always consult your prescriber
            </p>
          </>
        )}

        <NavBar active="pgx" />
      </div>
    </div>
  );
}

function NavBar({ active }: { active: string }) {
  const items = [
    { href: "/upload", icon: "🏠", label: "Home" },
    { href: "/blood", icon: "🩸", label: "Blood" },
    { href: "/dna", icon: "🧬", label: "DNA" },
    { href: "/pgx", icon: "💊", label: "PGx" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-[#dfe8e3] flex justify-around py-3 px-4 backdrop-blur">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex flex-col items-center gap-0.5 ${
            active === i.label.toLowerCase()
              ? "text-[#347b73]"
              : "text-slate-400"
          }`}
        >
          <span className="text-xl">{i.icon}</span>
          <span className="text-[10px] font-medium">{i.label}</span>
        </Link>
      ))}
    </div>
  );
}
