"use client";
import { useState } from "react";
import Link from "next/link";

const diplotypes = [
  {
    diplotype: "*1/*1",
    phenotype: "Normal Metabolizer",
    status: "safe",
    note: "Normal CYP2C19 function expected.",
  },
  {
    diplotype: "*1/*2",
    phenotype: "Intermediate Metabolizer",
    status: "moderate",
    note: "Reduced conversion of some CYP2C19-activated drugs.",
  },
  {
    diplotype: "*2/*2",
    phenotype: "Poor Metabolizer",
    status: "risk",
    note: "Substantially reduced clopidogrel activation expected.",
  },
  {
    diplotype: "*17/*17",
    phenotype: "Ultrarapid Metabolizer",
    status: "safe",
    note: "No reduced clopidogrel activation predicted.",
  },
];

const statusConfig: Record<
  string,
  { chip: string; label: string; border: string }
> = {
  risk: {
    chip: "bg-[#fceeee] text-[#9d3f3f]",
    label: "High impact",
    border: "border-[#efcaca]",
  },
  moderate: {
    chip: "bg-[#f8f1e6] text-[#8a6334]",
    label: "Moderate",
    border: "border-[#ead7bd]",
  },
  safe: {
    chip: "bg-[#eef7f4] text-[#347b73]",
    label: "Standard",
    border: "border-[#c8ded8]",
  },
};

export default function DnaPage() {
  const [selected, setSelected] = useState("*2/*2");
  const [submitted, setSubmitted] = useState(false);

  const result = diplotypes.find((d) => d.diplotype === selected);

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            DNA Analysis
          </p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            CYP2C19
            <br />
            Phenotype Map
          </h1>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-[1.75rem] border border-[#dfe8e3] shadow-[0_8px_22px_rgba(45,65,59,0.05)] p-5">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Select your diplotype
            </p>
            <p className="text-xs text-slate-400 mb-4">
              v1 uses direct star allele input
            </p>

            <div className="space-y-2 mb-5">
              {diplotypes.map((item) => (
                <label
                  key={item.diplotype}
                  className="flex items-center gap-3 p-3 border border-[#dfe8e3] rounded-2xl cursor-pointer hover:bg-[#f8faf8]"
                >
                  <input
                    type="radio"
                    name="diplotype"
                    checked={selected === item.diplotype}
                    onChange={() => setSelected(item.diplotype)}
                    className="accent-[#347b73] w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      {item.diplotype}
                    </span>
                    <p className="text-xs text-slate-400">{item.phenotype}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => setSubmitted(true)}
              className="w-full py-3 bg-[#347b73] text-white rounded-[1.25rem] font-semibold text-sm hover:bg-[#286961] transition-colors"
            >
              Map Phenotype →
            </button>
          </div>
        ) : result ? (
          <>
            <div className="bg-[#eef7f4] border border-[#c8ded8] rounded-[1.75rem] p-4 flex items-center gap-3 mb-5">
              <span className="text-3xl">🧬</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Phenotype Mapped
                </p>
                <p className="text-xs text-slate-400">
                  CPIC Diplotype-Phenotype Table
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">
              Result
            </p>
            <div
              className={`bg-white border ${
                statusConfig[result.status].border
              } rounded-[1.75rem] p-4 shadow-[0_8px_22px_rgba(45,65,59,0.05)]`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    CYP2C19 {result.diplotype}
                  </p>
                  <p className="text-xs text-slate-400">{result.phenotype}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusConfig[result.status].chip
                  }`}
                >
                  {statusConfig[result.status].label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                {result.note}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-300">
                  Source: CPIC phenotype table
                </span>
                <Link
                  href="/pgx"
                  className="text-xs text-[#347b73] font-medium"
                >
                  Drug check →
                </Link>
              </div>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full mt-4 py-3 border border-[#dfe8e3] text-slate-500 rounded-[1.25rem] text-sm font-medium hover:bg-white transition-colors"
            >
              ← Select different diplotype
            </button>
          </>
        ) : null}

        <NavBar active="dna" />
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
