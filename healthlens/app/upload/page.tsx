"use client";
import { useState } from "react";
import Link from "next/link";

const inputItems = [
  {
    key: "genotype",
    icon: "🧬",
    title: "CYP2C19 Genotype",
    value: "*2/*2 selected",
    hint: "Direct star allele input for v1",
    bg: "bg-[#eef7f4]",
  },
  {
    key: "meds",
    icon: "💊",
    title: "Current Medication",
    value: "Clopidogrel",
    hint: "CPIC-covered drug-gene pair",
    bg: "bg-[#f8f1e6]",
  },
  {
    key: "indication",
    icon: "🏥",
    title: "Clinical Indication",
    value: "ACS/PCI",
    hint: "Recommendation depends on indication",
    bg: "bg-[#eef3f8]",
  },
];

export default function UploadPage() {
  const [uploaded, setUploaded] = useState({
    genotype: true,
    meds: true,
    indication: false,
  });

  const completed = Object.values(uploaded).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            HealthLens
          </p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Good morning,
            <br />
            Lisa Chen
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Prepare your PGx safety check
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-slate-400">
            {completed} of 3 inputs ready
          </span>
          <div className="flex gap-1.5">
            {["genotype", "meds", "indication"].map((k) => (
              <div
                key={k}
                className={`w-2 h-2 rounded-full ${
                  uploaded[k as keyof typeof uploaded]
                    ? "bg-[#4d8c83]"
                    : "bg-[#d9e2de]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {inputItems.map((item) => {
            const active = uploaded[item.key as keyof typeof uploaded];
            return (
              <button
                key={item.key}
                onClick={() =>
                  setUploaded((u) => ({
                    ...u,
                    [item.key]: !active,
                  }))
                }
                className={`w-full bg-white border ${
                  active
                    ? "border-[#b8d6ce] bg-[#fbfefd]"
                    : "border-dashed border-[#dfe8e3]"
                } rounded-[1.75rem] p-4 flex items-center gap-3 cursor-pointer text-left shadow-[0_6px_18px_rgba(45,65,59,0.04)]`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-xl flex-shrink-0`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {active ? item.value : item.hint}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#4d8c83]">
                  {active ? "✓" : "+"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#dfe8e3] rounded-[1.75rem] p-4 mb-4 shadow-[0_8px_22px_rgba(45,65,59,0.05)]">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
            Query tuple
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            CYP2C19 + Poor Metabolizer + clopidogrel + ACS/PCI. This exact
            tuple is used for structured CPIC lookup, not vector search.
          </p>
        </div>

        <Link
          href="/dna"
          className={`w-full py-4 rounded-[1.5rem] font-semibold text-sm tracking-wide flex items-center justify-center transition-colors ${
            completed === 3
              ? "bg-[#347b73] text-white hover:bg-[#286961]"
              : "bg-[#e7ece9] text-slate-400 pointer-events-none"
          }`}
        >
          Map Genotype →
        </Link>

        <NavBar active="home" />
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
