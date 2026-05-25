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
    chip: "bg-red-50 text-red-600",
    label: "High impact",
    border: "border-red-100",
  },
  moderate: {
    chip: "bg-amber-50 text-amber-700",
    label: "Moderate",
    border: "border-amber-100",
  },
  safe: {
    chip: "bg-teal-50 text-teal-700",
    label: "Standard",
    border: "border-teal-100",
  },
};

export default function DnaPage() {
  const [selected, setSelected] = useState("*2/*2");
  const [submitted, setSubmitted] = useState(false);

  const result = diplotypes.find((d) => d.diplotype === selected);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            DNA Analysis
          </p>
          <h1
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            CYP2C19
            <br />
            Phenotype Map
          </h1>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Select your diplotype
            </p>
            <p className="text-xs text-gray-400 mb-4">
              v1 uses direct star allele input
            </p>

            <div className="space-y-2 mb-5">
              {diplotypes.map((item) => (
                <label
                  key={item.diplotype}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="diplotype"
                    checked={selected === item.diplotype}
                    onChange={() => setSelected(item.diplotype)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.diplotype}
                    </span>
                    <p className="text-xs text-gray-400">{item.phenotype}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => setSubmitted(true)}
              className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
            >
              Map Phenotype →
            </button>
          </div>
        ) : result ? (
          <>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3 mb-5">
              <span className="text-3xl">🧬</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Phenotype Mapped
                </p>
                <p className="text-xs text-gray-400">
                  CPIC Diplotype-Phenotype Table
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
              Result
            </p>
            <div
              className={`bg-white border ${
                statusConfig[result.status].border
              } rounded-2xl p-4 shadow-sm`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    CYP2C19 {result.diplotype}
                  </p>
                  <p className="text-xs text-gray-400">{result.phenotype}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    statusConfig[result.status].chip
                  }`}
                >
                  {statusConfig[result.status].label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {result.note}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-300">
                  Source: CPIC phenotype table
                </span>
                <Link
                  href="/pgx"
                  className="text-xs text-teal-600 font-medium"
                >
                  Drug check →
                </Link>
              </div>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full mt-4 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
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
