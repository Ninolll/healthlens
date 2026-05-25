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
    bar: "bg-red-500",
    chip: "bg-red-50 text-red-600",
    label: "Very high",
  },
  "Above average": {
    bar: "bg-red-400",
    chip: "bg-red-50 text-red-500",
    label: "Above avg",
  },
  "Normal range": {
    bar: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700",
    label: "Normal",
  },
  "Below average": {
    bar: "bg-amber-400",
    chip: "bg-amber-50 text-amber-700",
    label: "Below avg",
  },
  "Very low": {
    bar: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700",
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
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-8 px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            Blood Analysis
          </p>
          <h1
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {submitted ? "Your Results vs Population" : "Enter Your Values"}
          </h1>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="35"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-teal-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">
                  Sex
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-teal-400"
                >
                  <option value="2">Female</option>
                  <option value="1">Male</option>
                </select>
              </div>
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 font-medium mb-1 block">
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-teal-400"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!form.age || loading}
              className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-teal-700 transition-colors"
            >
              {loading ? "Analysing..." : "Analyse →"}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 text-center mb-5">
              <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase mb-2">
                Results
              </p>
              <p className="text-sm text-gray-500">
                {results.length} biomarkers analysed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
              {results.map((r) => {
                const s =
                  statusConfig[r.interpretation] ||
                  statusConfig["Normal range"];
                return (
                  <div key={r.biomarker} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {r.biomarker}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {r.user_value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${s.bar}`}
                        style={{ width: `${r.percentile}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {r.percentile}th percentile · mean {r.pop_mean}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.chip}`}
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
              className="w-full mt-4 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 px-4">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex flex-col items-center gap-0.5 ${active === i.label.toLowerCase() ? "text-teal-600" : "text-gray-400"}`}
        >
          <span className="text-xl">{i.icon}</span>
          <span className="text-[10px] font-medium">{i.label}</span>
        </Link>
      ))}
    </div>
  );
}
