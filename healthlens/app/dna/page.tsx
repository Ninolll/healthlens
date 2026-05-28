"use client";
import { useState } from "react";
import Link from "next/link";

const diplotypes = [
  {
    diplotype: "*1/*1",
    phenotype: "Normal Metabolizer",
    status: "safe" as const,
    note: "Standard CYP2C19 function expected. No reduced drug activation predicted for clopidogrel.",
    action: "No genotype-based concern for clopidogrel in this result.",
  },
  {
    diplotype: "*1/*2",
    phenotype: "Intermediate Metabolizer",
    status: "monitor" as const,
    note: "Reduced CYP2C19 activity predicted. Some reduction in clopidogrel activation may be relevant.",
    action: "Discuss with your prescribing clinician whether this affects your medication plan.",
  },
  {
    diplotype: "*1/*3",
    phenotype: "Intermediate Metabolizer",
    status: "monitor" as const,
    note: "Reduced CYP2C19 activity predicted. Some reduction in clopidogrel activation may be relevant.",
    action: "Discuss with your prescribing clinician whether this affects your medication plan.",
  },
  {
    diplotype: "*2/*2",
    phenotype: "Poor Metabolizer",
    status: "discuss" as const,
    note: "Substantially reduced CYP2C19 function predicted. This may affect how your body processes clopidogrel.",
    action: "Bring this result to the clinician who manages your medication.",
  },
  {
    diplotype: "*2/*3",
    phenotype: "Poor Metabolizer",
    status: "discuss" as const,
    note: "Substantially reduced CYP2C19 function predicted. This may affect how your body processes clopidogrel.",
    action: "Bring this result to the clinician who manages your medication.",
  },
  {
    diplotype: "*17/*17",
    phenotype: "Ultrarapid Metabolizer",
    status: "safe" as const,
    note: "Increased CYP2C19 activity predicted. No reduced clopidogrel activation predicted.",
    action: "No genotype-based concern for clopidogrel in this result.",
  },
];

const statusStyle = {
  discuss: {
    headerBg: "bg-[#ff3b30]",
    headerLabel: "Discuss with clinician",
  },
  monitor: {
    headerBg: "bg-[#ff9500]",
    headerLabel: "Monitor",
  },
  safe: {
    headerBg: "bg-[#34c759]",
    headerLabel: "No concern flagged",
  },
};

export default function DnaPage() {
  const [selected, setSelected] = useState("*2/*2");
  const [submitted, setSubmitted] = useState(false);

  const result = diplotypes.find((d) => d.diplotype === selected);

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      <div className="mx-auto w-full max-w-[430px]">

        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
            DNA · CYP2C19
          </p>
          <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight">
            Phenotype result
          </h1>
        </header>

        {!submitted ? (
          <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-[#1c1c1e]">Select your CYP2C19 diplotype</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">Found in your genetic test report</p>
            </div>
            <div className="divide-y divide-[#e5e5ea] border-t border-[#e5e5ea]">
              {diplotypes.map((item) => (
                <label
                  key={item.diplotype}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="diplotype"
                    checked={selected === item.diplotype}
                    onChange={() => setSelected(item.diplotype)}
                    className="accent-[#007aff] w-4 h-4 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1c1c1e]">{item.diplotype}</p>
                    <p className="text-xs text-[#8e8e93]">{item.phenotype}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-4 py-4">
              <button
                onClick={() => setSubmitted(true)}
                className="w-full rounded-2xl bg-[#007aff] py-3 text-sm font-semibold text-white"
              >
                View phenotype result
              </button>
            </div>
          </section>
        ) : result ? (
          <div className="flex flex-col gap-4 px-4">
            <article className="overflow-hidden rounded-2xl shadow-sm">
              <div className={`${statusStyle[result.status].headerBg} px-4 pb-4 pt-4`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                  {statusStyle[result.status].headerLabel}
                </p>
                <h3 className="mt-1 text-[19px] font-bold leading-snug text-white">
                  CYP2C19 {result.diplotype}
                </h3>
                <p className="mt-0.5 text-sm text-white/80">{result.phenotype}</p>
              </div>
              <div className="bg-white px-4 py-4 space-y-4">
                <p className="text-sm leading-5 text-[#3a3a3c]">{result.note}</p>

                <div className="border-t border-[#e5e5ea] pt-3 space-y-1.5">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-[11px] font-semibold text-[#3a3a3c]">Next step</span>
                    <span className="text-[11px] text-[#8e8e93]">{result.action}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-[11px] font-semibold text-[#3a3a3c]">Does not mean</span>
                    <span className="text-[11px] text-[#8e8e93]">
                      This genotype alone does not determine whether a medication is right for you.
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">Source</p>
                  <p className="text-xs text-[#8e8e93]">CPIC diplotype–phenotype table · cpicpgx.org</p>
                </div>

                <div className="border-t border-[#e5e5ea] pt-3 flex justify-end">
                  <Link href="/pgx" className="text-sm font-semibold text-[#007aff]">
                    Check drug safety →
                  </Link>
                </div>
              </div>
            </article>

            <button
              onClick={() => setSubmitted(false)}
              className="py-3 text-sm font-semibold text-[#007aff]"
            >
              ← Choose different diplotype
            </button>
          </div>
        ) : null}
      </div>

      <NavBar active="dna" />
    </div>
  );
}

function NavBar({ active }: { active: string }) {
  const items = [
    { href: "/",      icon: "✦",  label: "Results" },
    { href: "/blood", icon: "🩸", label: "Blood"   },
    { href: "/dna",   icon: "🧬", label: "DNA"     },
    { href: "/pgx",   icon: "💊", label: "PGx"     },
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
            <span className="text-lg leading-none">{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
