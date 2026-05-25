"use client";
import { useState } from "react";
import Link from "next/link";

const fields = [
  {
    key: "cholesterol",
    label: "Total Cholesterol",
    unit: "mg/dL",
    col: "LBXSCH",
  },
  { key: "glucose", label: "Glucose", unit: "mg/dL", col: "LBXSGL" },
  {
    key: "triglycerides",
    label: "Triglycerides",
    unit: "mg/dL",
    col: "LBXSTR",
  },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", col: "LBXSCR" },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", col: "LBXHGB" },
];

type BiomarkerKey = (typeof fields)[number]["key"];

type AnalysisRequest = {
  age: number;
  gender: number;
} & Partial<Record<BiomarkerKey, number>>;

type AnalysisResult = {
  biomarker: string;
  user_value: number;
  percentile: number;
  pop_mean: number;
  interpretation: string;
};

const statusConfig: Record<
  string,
  { bar: string; chip: string; label: string }
> = {
  "Very high": {
    bar: "bg-[#c76d6d]",
    chip: "bg-[#fceeee] text-[#9d3f3f]",
    label: "Very high",
  },
  "Above average": {
    bar: "bg-[#d88b7e]",
    chip: "bg-[#fceeee] text-[#9d3f3f]",
    label: "Above avg",
  },
  "Normal range": {
    bar: "bg-[#6ba79e]",
    chip: "bg-[#eef7f4] text-[#347b73]",
    label: "Normal",
  },
  "Below average": {
    bar: "bg-[#c79b5b]",
    chip: "bg-[#f8f1e6] text-[#8a6334]",
    label: "Below avg",
  },
  "Very low": {
    bar: "bg-[#7395b8]",
    chip: "bg-[#eef3f8] text-[#496f93]",
    label: "Very low",
  },
};

export default function BloodPage() {
  const [form, setForm] = useState({
    age: "",
    gender: "2",
    cholesterol: "",
    glucose: "",
    triglycerides: "",
    creatinine: "",
    hemoglobin: "",
  });
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const body: AnalysisRequest = {
      age: parseInt(form.age),
      gender: parseInt(form.gender),
    };
    fields.forEach((f) => {
      if (form[f.key as keyof typeof form])
        body[f.key] = parseFloat(form[f.key as keyof typeof form]);
    });
    const res = await fetch("http://localhost:8000/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setResults(data.results);
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Blood Analysis
          </p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {submitted ? "Your Results vs Population" : "Enter Your Values"}
          </h1>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-[1.75rem] border border-[#dfe8e3] shadow-[0_8px_22px_rgba(45,65,59,0.05)] p-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 font-medium mb-1 block">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="35"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 font-medium mb-1 block">
                  Sex
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                >
                  <option value="2">Female</option>
                  <option value="1">Male</option>
                </select>
              </div>
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 font-medium mb-1 block">
                  {f.label} ({f.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="optional"
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="w-full border border-[#dfe8e3] bg-[#fbfcfb] rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6ba79e]"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!form.age || loading}
              className="w-full py-3 bg-[#347b73] text-white rounded-[1.25rem] font-semibold text-sm disabled:opacity-40 hover:bg-[#286961] transition-colors"
            >
              {loading ? "Analysing..." : "Analyse →"}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#eef7f4] border border-[#c8ded8] rounded-[1.75rem] p-5 text-center mb-5">
              <p className="text-xs font-semibold tracking-widest text-[#347b73] uppercase mb-2">
                Results
              </p>
              <p className="text-sm text-slate-500">
                {results.length} biomarkers analysed
              </p>
            </div>

            <div className="bg-white rounded-[1.75rem] border border-[#dfe8e3] divide-y divide-[#eef1ef] overflow-hidden shadow-[0_8px_22px_rgba(45,65,59,0.05)]">
              {results.map((r) => {
                const s =
                  statusConfig[r.interpretation] ||
                  statusConfig["Normal range"];
                return (
                  <div key={r.biomarker} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {r.biomarker}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {r.user_value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#eef1ef] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${s.bar}`}
                        style={{ width: `${r.percentile}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {r.percentile}th percentile · mean {r.pop_mean}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full mt-4 py-3 border border-[#dfe8e3] text-slate-500 rounded-[1.25rem] text-sm font-medium hover:bg-white transition-colors"
            >
              ← Enter new values
            </button>
          </>
        )}

        <NavBar active="blood" />
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
