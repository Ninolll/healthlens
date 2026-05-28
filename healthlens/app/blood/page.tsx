"use client";
import { useState } from "react";
import Link from "next/link";

// Mock results for prototype — replace with real NHANES percentile API when backend is ready
const MOCK_RESULTS = [
  { biomarker: "ApoB", user_value: 125, unit: "mg/dL", percentile: 88, pop_mean: 78, status: "above" as const },
  { biomarker: "LDL-C", user_value: 155, unit: "mg/dL", percentile: 82, pop_mean: 112, status: "above" as const },
  { biomarker: "hs-CRP", user_value: 4.2, unit: "mg/L", percentile: 76, pop_mean: 2.1, status: "above" as const },
  { biomarker: "Homocysteine", user_value: 7.8, unit: "µmol/L", percentile: 45, pop_mean: 9.2, status: "normal" as const },
  { biomarker: "Total Cholesterol", user_value: 210, unit: "mg/dL", percentile: 65, pop_mean: 196, status: "normal" as const },
];

type MockResult = (typeof MOCK_RESULTS)[number];

const fields = [
  { key: "apob",        label: "ApoB",             unit: "mg/dL"  },
  { key: "ldl",         label: "LDL-C",             unit: "mg/dL"  },
  { key: "hscrp",       label: "hs-CRP",            unit: "mg/L"   },
  { key: "homocysteine",label: "Homocysteine",       unit: "µmol/L" },
  { key: "cholesterol", label: "Total Cholesterol",  unit: "mg/dL"  },
];

export default function BloodPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [results, setResults] = useState<MockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleAnalyse() {
    setLoading(true);
    // Prototype: use mock results. Real percentile API (localhost:8000/analyse) will be wired in MVP.
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setSubmitted(true);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      <div className="mx-auto w-full max-w-[430px]">

        <header className="px-4 pb-4 pt-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
            Blood markers
          </p>
          <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight">
            {submitted ? "Your blood results" : "Enter your values"}
          </h1>
        </header>

        {!submitted ? (
          <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-[#1c1c1e]">Add your latest lab values</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">
                All fields optional · values compared against population reference
              </p>
            </div>
            <div className="divide-y divide-[#e5e5ea] border-t border-[#e5e5ea]">
              {fields.map((f) => (
                <label key={f.key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[#1c1c1e]">
                    {f.label}
                    <span className="ml-1 text-xs text-[#8e8e93]">{f.unit}</span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="—"
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-24 text-right text-sm font-semibold text-[#007aff] bg-transparent focus:outline-none placeholder:text-[#c7c7cc]"
                  />
                </label>
              ))}
            </div>
            <div className="px-4 py-4">
              <button
                onClick={handleAnalyse}
                disabled={loading}
                className="w-full rounded-2xl bg-[#007aff] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {loading ? "Analysing…" : "Show results"}
              </button>
              <p className="mt-2 text-center text-[10px] text-[#c7c7cc]">
                Prototype · showing sample data
              </p>
            </div>
          </section>
        ) : (
          <>
            <div className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm px-4 py-3">
              <p className="text-xs text-[#8e8e93]">
                Results compared against population reference ranges. This is not a clinical interpretation — see your results page for the full picture.
              </p>
            </div>

            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
              Your markers
            </p>
            <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="divide-y divide-[#e5e5ea]">
                {results.map((r) => (
                  <div key={r.biomarker} className="px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold">{r.biomarker}</span>
                      <div>
                        <span className={`text-[20px] font-bold tabular-nums leading-none tracking-tight ${r.status === "above" ? "text-[#ff3b30]" : "text-[#1c1c1e]"}`}>
                          {r.user_value}
                        </span>
                        <span className="ml-1 text-xs text-[#8e8e93]">{r.unit}</span>
                      </div>
                    </div>
                    <div className="relative mt-2 h-1.5 rounded-full bg-[#e5e5ea]">
                      <div
                        className={`absolute h-full rounded-full ${r.status === "above" ? "bg-[#ff3b3040]" : "bg-[#34c75940]"}`}
                        style={{ width: `${Math.min(r.percentile, 100)}%` }}
                      />
                      <div
                        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ${r.status === "above" ? "bg-[#ff3b30]" : "bg-[#34c759]"}`}
                        style={{ left: `${Math.min(r.percentile, 97)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-[#c7c7cc]">
                      <span>{r.percentile}th percentile</span>
                      <span>pop. avg {r.pop_mean} {r.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="px-4 mt-4">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full py-3 text-sm font-semibold text-[#007aff]"
              >
                ← Enter different values
              </button>
            </div>
          </>
        )}
      </div>

      <NavBar active="blood" />
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
