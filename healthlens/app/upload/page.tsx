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
    bg: "bg-teal-50",
  },
  {
    key: "meds",
    icon: "💊",
    title: "Current Medication",
    value: "Clopidogrel",
    hint: "CPIC-covered drug-gene pair",
    bg: "bg-amber-50",
  },
  {
    key: "indication",
    icon: "🏥",
    title: "Clinical Indication",
    value: "ACS/PCI",
    hint: "Recommendation depends on indication",
    bg: "bg-blue-50",
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
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            HealthLens
          </p>
          <h1
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Good morning,
            <br />
            Lisa Chen
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Prepare your PGx safety check
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-gray-400">
            {completed} of 3 inputs ready
          </span>
          <div className="flex gap-1.5">
            {["genotype", "meds", "indication"].map((k) => (
              <div
                key={k}
                className={`w-2 h-2 rounded-full ${
                  uploaded[k as keyof typeof uploaded]
                    ? "bg-teal-500"
                    : "bg-gray-200"
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
                  active ? "border-teal-200" : "border-dashed border-gray-200"
                } rounded-2xl p-4 flex items-center gap-3 cursor-pointer text-left`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-xl flex-shrink-0`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {active ? item.value : item.hint}
                  </p>
                </div>
                <span className="text-lg">{active ? "✅" : "+"}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Query tuple
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            CYP2C19 + Poor Metabolizer + clopidogrel + ACS/PCI. This exact
            tuple is used for structured CPIC lookup, not vector search.
          </p>
        </div>

        <Link
          href="/dna"
          className={`w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center transition-colors ${
            completed === 3
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "bg-gray-100 text-gray-400 pointer-events-none"
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 px-4">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex flex-col items-center gap-0.5 ${
            active === i.label.toLowerCase() ? "text-teal-600" : "text-gray-400"
          }`}
        >
          <span className="text-xl">{i.icon}</span>
          <span className="text-[10px] font-medium">{i.label}</span>
        </Link>
      ))}
    </div>
  );
}
