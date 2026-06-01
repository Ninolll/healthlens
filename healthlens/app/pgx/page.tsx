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

type Status = "caution" | "danger" | "safe" | "unknown";

const statusHeader: Record<Status, { bg: string; subtext: string }> = {
  danger:  { bg: "bg-[#ff3b30]", subtext: "Discuss with clinician" },
  caution: { bg: "bg-[#ff9500]", subtext: "Monitor" },
  safe:    { bg: "bg-[#34c759]", subtext: "No concern flagged" },
  unknown: { bg: "bg-[#8e8e93]", subtext: "No guideline found" },
};

function getRecommendation(diplotype: string, drug: string, indication: Indication) {
  const phenotype = phenotypeMap[diplotype] || "Indeterminate";

  if (drug !== "Clopidogrel" || phenotype === "Indeterminate") {
    return {
      name: drug,
      gene: `CYP2C19 · ${phenotype}`,
      status: "unknown" as Status,
      recommendation:
        "No guideline currently covers this exact gene × drug query. This does not mean there is no interaction — it means evidence is insufficient for a recommendation.",
      alternatives: ["Consult clinician or pharmacist"],
      evidence: [
        "CPIC record: not found",
        "PharmGKB fallback: not enabled in v1",
      ],
      badge: "Tier 3 · No data",
    };
  }

  if (phenotype === "Poor Metabolizer") {
    const neurovascular = indication === "neurovascular";
    return {
      name: "Clopidogrel",
      gene: `CYP2C19 · ${phenotype}`,
      status: "danger" as Status,
      recommendation: neurovascular
        ? "This gene-drug result should be reviewed with your prescribing clinician. Your CYP2C19 result may reduce clopidogrel activation, and medication choice depends on your clinical context."
        : "This gene-drug result should be reviewed with your prescribing clinician. Your CYP2C19 genotype predicts substantially reduced clopidogrel activation, but medication changes require clinician guidance.",
      alternatives: neurovascular
        ? ["Ask about clopidogrel appropriateness", "Ask about stroke/TIA medication constraints"]
        : ["Ask about clopidogrel appropriateness", "Ask whether alternatives should be considered"],
      evidence: [
        `${diplotype} → Poor Metabolizer`,
        `CYP2C19 + Poor Metabolizer + clopidogrel + ${indicationLabels[indication]}`,
        "Poor Metabolizer + Strong CPIC record → high alert",
      ],
      badge: "CPIC 2022 · PMID 35034351",
    };
  }

  if (phenotype === "Intermediate Metabolizer") {
    return {
      name: "Clopidogrel",
      gene: `CYP2C19 · ${phenotype}`,
      status: "caution" as Status,
      recommendation:
        "Reduced clopidogrel activation may be relevant. Discuss whether this changes your medication plan with the clinician who prescribed it.",
      alternatives: ["Ask about reduced activation", "Ask whether follow-up is needed"],
      evidence: [
        `${diplotype} → Intermediate Metabolizer`,
        `CYP2C19 + Intermediate Metabolizer + clopidogrel + ${indicationLabels[indication]}`,
        "Intermediate Metabolizer → moderate alert",
      ],
      badge: "CPIC 2022 · PMID 35034351",
    };
  }

  return {
    name: "Clopidogrel",
    gene: `CYP2C19 · ${phenotype}`,
    status: "safe" as Status,
    recommendation:
      "No pharmacogenomic concern is flagged for this phenotype in this mock result. Continue to follow your clinician's medication plan.",
    alternatives: [],
    evidence: [
      `${diplotype} → ${phenotype}`,
      `CYP2C19 + ${phenotype} + clopidogrel + ${indicationLabels[indication]}`,
      "Normal/Rapid/Ultrarapid phenotype → low alert",
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

  const header = statusHeader[result.status];

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      <div className="mx-auto w-full max-w-[430px]">

        <div className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
            Drug Safety
          </p>
          <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight">
            Medication check
          </h1>
        </div>

        {!submitted ? (
          <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-[#1c1c1e]">Run PGx safety check</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">CPIC lookup · exact metadata, not RAG</p>
            </div>
            <div className="divide-y divide-[#e5e5ea] border-t border-[#e5e5ea]">
              <label className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1c1c1e]">CYP2C19 diplotype</span>
                <select
                  value={diplotype}
                  onChange={(e) => setDiplotype(e.target.value)}
                  className="text-right text-sm font-semibold text-[#007aff] bg-transparent focus:outline-none"
                >
                  {Object.keys(phenotypeMap).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                  <option>Unknown</option>
                </select>
              </label>
              <label className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1c1c1e]">Medication</span>
                <select
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  className="text-right text-sm font-semibold text-[#007aff] bg-transparent focus:outline-none"
                >
                  <option>Clopidogrel</option>
                  <option>Warfarin</option>
                  <option>Codeine</option>
                </select>
              </label>
              <label className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1c1c1e]">Clinical indication</span>
                <select
                  value={indication}
                  onChange={(e) => setIndication(e.target.value as Indication)}
                  className="text-right text-sm font-semibold text-[#007aff] bg-transparent focus:outline-none"
                >
                  <option value="acs_pci">ACS/PCI</option>
                  <option value="neurovascular">Stroke/TIA</option>
                  <option value="stable_cad">Stable CAD</option>
                </select>
              </label>
            </div>
            <div className="px-4 py-4">
              <button
                onClick={handleSubmit}
                disabled={analysing}
                className="w-full rounded-2xl bg-[#007aff] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {analysing ? "Checking compatibility…" : "Check drug safety"}
              </button>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Result card — severity drives the header treatment */}
            <article className="overflow-hidden rounded-2xl shadow-sm">
              <div className={`${header.bg} px-4 pb-4 pt-4`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                  {header.subtext}
                </p>
                <h3 className="mt-1 text-[19px] font-bold leading-snug text-white">
                  {result.name}
                </h3>
                <p className="mt-0.5 text-sm text-white/80">{result.gene}</p>
              </div>
              <div className="bg-white px-4 py-4 space-y-4">
                <p className="text-sm leading-5 text-[#3a3a3c]">{result.recommendation}</p>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
                    Evidence
                  </p>
                  <div className="divide-y divide-[#e5e5ea]">
                    {result.evidence.map((item, i) => (
                      <div key={item} className="flex gap-3 py-2.5">
                        <span className="text-xs font-bold tabular-nums text-[#c7c7cc]">{i + 1}</span>
                        <p className="text-xs leading-5 text-[#3a3a3c]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.alternatives.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
                      Questions to ask
                    </p>
                    <div className="space-y-1.5">
                      {result.alternatives.map((a) => (
                        <p key={a} className="text-sm text-[#1c1c1e]">· {a}</p>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#c7c7cc]">{result.badge}</p>
              </div>
            </article>

            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-2xl bg-[#1c1c1e] py-3 text-sm font-semibold text-white"
            >
              View full results →
            </Link>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-2.5 text-sm font-semibold text-[#007aff]"
            >
              ← New query
            </button>

            <p className="text-center text-[10px] text-[#c7c7cc]">
              Source: CPIC Guidelines 2022 · Always consult your prescriber
            </p>
          </div>
        )}

        <NavBar active="pgx" />
      </div>
    </div>
  );
}

function NavBar({ active }: { active: string }) {
  const items = [
    { href: "/",     icon: "✦",  label: "Results" },
    { href: "/blood", icon: "🩸", label: "Blood" },
    { href: "/dna",  icon: "🧬", label: "DNA" },
    { href: "/pgx",  icon: "💊", label: "PGx" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5ea] bg-white/95 px-5 pb-8 pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] justify-around">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
              active === i.label.toLowerCase() ? "text-[#007aff]" : "text-[#8e8e93]"
            }`}
          >
            <span className="text-xl">{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
