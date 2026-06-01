"use client";
import { useState } from "react";
import Link from "next/link";

// ─── mock processing results ──────────────────────────────────────────────────
const DNA_RESULT = {
  summary: "CYP2C19 *2/*2 · Poor Metabolizer",
  detail: "Clopidogrel activation may be reduced",
};
const BLOOD_RESULT = {
  summary: "5 markers imported",
  detail: "ApoB · LDL-C · hs-CRP · Homocysteine · Total Cholesterol",
};

// ─── types ────────────────────────────────────────────────────────────────────
type UploadState = "empty" | "loading" | "done";

function useUploadSlot() {
  const [state, setState] = useState<UploadState>("empty");
  const [filename, setFilename] = useState<string | null>(null);

  function simulate(name: string) {
    setFilename(name);
    setState("loading");
    setTimeout(() => setState("done"), 1200);
  }

  function reset() {
    setFilename(null);
    setState("empty");
  }

  return { state, filename, simulate, reset };
}

export default function UploadPage() {
  const dna = useUploadSlot();
  const blood = useUploadSlot();
  const [med, setMed] = useState("Clopidogrel");
  const [medSaved, setMedSaved] = useState(true);

  const readyCount = (dna.state === "done" ? 1 : 0) + (blood.state === "done" ? 1 : 0) + (medSaved ? 1 : 0);
  const allReady = dna.state === "done" && blood.state === "done";

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      <div className="mx-auto w-full max-w-[430px]">

        {/* Header */}
        <header className="flex items-center justify-between px-4 pb-3 pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
              HealthLens
            </p>
            <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight">
              Add your data
            </h1>
            <p className="mt-1 text-sm text-[#3a3a3c]">Upload your DNA and blood test to see your results.</p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#007aff] shadow-sm"
          >
            Back to app
          </Link>
        </header>

        {/* Progress */}
        <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i < readyCount ? "bg-[#34c759]" : "bg-[#e5e5ea]"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-[#8e8e93]">
            {readyCount} of 3 sources ready
          </p>
        </div>

        {/* DNA upload */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Genetic data
        </p>
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          {dna.state === "empty" && (
            <DropZone
              icon="🧬"
              title="Upload genetic test results"
              subtitle="23andMe · AncestryDNA · raw VCF · CPIC report"
              formats="PDF · CSV · TXT · VCF"
              onSimulate={() => dna.simulate("cyp2c19_report.pdf")}
            />
          )}
          {dna.state === "loading" && (
            <LoadingSlot icon="🧬" filename={dna.filename!} label="Reading CYP2C19 variants…" />
          )}
          {dna.state === "done" && (
            <DoneSlot
              icon="🧬"
              filename={dna.filename!}
              summary={DNA_RESULT.summary}
              detail={DNA_RESULT.detail}
              onRemove={dna.reset}
            />
          )}
        </section>

        {/* Blood upload */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Blood test results
        </p>
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          {blood.state === "empty" && (
            <DropZone
              icon="🩸"
              title="Upload your lab report"
              subtitle="Most recent blood panel · lipids · inflammation"
              formats="PDF · CSV · image"
              onSimulate={() => blood.simulate("labcorp_results_may2026.pdf")}
            />
          )}
          {blood.state === "loading" && (
            <LoadingSlot icon="🩸" filename={blood.filename!} label="Extracting marker values…" />
          )}
          {blood.state === "done" && (
            <DoneSlot
              icon="🩸"
              filename={blood.filename!}
              summary={BLOOD_RESULT.summary}
              detail={BLOOD_RESULT.detail}
              onRemove={blood.reset}
            />
          )}
        </section>

        {/* Medication */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Current medication <span className="ml-1 normal-case font-normal text-[#c7c7cc]">optional</span>
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-[#1c1c1e]">What are you currently taking?</p>
            <p className="mt-0.5 text-xs text-[#8e8e93]">
              Used to match against drug–gene guidance · not stored externally
            </p>
          </div>
          <div className="border-t border-[#e5e5ea] px-4 py-3">
            <input
              type="text"
              value={med}
              onChange={(e) => { setMed(e.target.value); setMedSaved(false); }}
              placeholder="e.g. Clopidogrel, Warfarin"
              className="w-full bg-transparent text-sm text-[#1c1c1e] placeholder:text-[#c7c7cc] focus:outline-none"
            />
          </div>
          {!medSaved && (
            <div className="border-t border-[#e5e5ea] px-4 pb-3 pt-2">
              <button
                onClick={() => setMedSaved(true)}
                className="w-full rounded-xl bg-[#f2f2f7] py-2 text-sm font-semibold text-[#007aff]"
              >
                Save
              </button>
            </div>
          )}
          {medSaved && (
            <div className="flex items-center gap-2 border-t border-[#e5e5ea] px-4 py-2.5">
              <span className="text-xs text-[#34c759] font-semibold">✓ Saved</span>
              <span className="text-xs text-[#8e8e93]">{med}</span>
            </div>
          )}
        </section>

        {/* What we use your data for */}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          How your data is used
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">DNA context</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">
                Your genotype is matched against published drug–gene guidelines to flag relevant combinations
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">Blood signals</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">
                Lab values show what your body is doing now — separate from what your genes predict
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#1c1c1e]">Privacy</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">
                Prototype only · data stays in your browser session · nothing is sent to external servers
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mx-4 mb-4">
          <Link
            href="/"
            className={`flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold transition-colors ${
              allReady
                ? "bg-[#1c1c1e] text-white"
                : "bg-[#e5e5ea] text-[#8e8e93] pointer-events-none"
            }`}
          >
            {allReady ? "View your results →" : "Upload DNA and blood test to continue"}
          </Link>
          {!allReady && (
            <Link
              href="/"
              className="mt-2 flex w-full items-center justify-center py-2 text-sm text-[#8e8e93]"
            >
              Skip for now — view mock results
            </Link>
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function DropZone({
  icon,
  title,
  subtitle,
  formats,
  onSimulate,
}: {
  icon: string;
  title: string;
  subtitle: string;
  formats: string;
  onSimulate: () => void;
}) {
  return (
    <button
      onClick={onSimulate}
      className="flex w-full flex-col items-center gap-3 px-4 py-8 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2f2f7] text-3xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1c1c1e]">{title}</p>
        <p className="mt-0.5 text-xs text-[#8e8e93]">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-dashed border-[#c7c7cc] px-5 py-2">
        <p className="text-xs font-semibold text-[#007aff]">Tap to select file</p>
        <p className="mt-0.5 text-[10px] text-[#c7c7cc]">{formats}</p>
      </div>
    </button>
  );
}

function LoadingSlot({ icon, filename, label }: { icon: string; filename: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f2f7] text-xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1c1c1e]">{filename}</p>
        <p className="mt-0.5 text-xs text-[#8e8e93]">{label}</p>
      </div>
      <LoadingSpinner />
    </div>
  );
}

function DoneSlot({
  icon,
  filename,
  summary,
  detail,
  onRemove,
}: {
  icon: string;
  filename: string;
  summary: string;
  detail: string;
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#34c75915] text-xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#34c759]">✓ Processed</span>
            <span className="truncate text-xs text-[#c7c7cc]">{filename}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#1c1c1e]">{summary}</p>
          <p className="mt-0.5 text-xs text-[#8e8e93]">{detail}</p>
        </div>
      </div>
      <div className="border-t border-[#e5e5ea] px-4 py-2.5">
        <button onClick={onRemove} className="text-xs font-semibold text-[#ff3b30]">
          Remove file
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#8e8e93]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function NavBar() {
  const items = [
    { href: "/",              icon: "✦", label: "App" },
    { href: "/upload",        icon: "＋", label: "Demo input"  },
    { href: "/?summary=1",    icon: "▤", label: "Summary" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5ea] bg-white/95 px-5 pb-8 pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] justify-around">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${i.label === "Inputs" ? "text-[#007aff]" : "text-[#8e8e93]"}`}
          >
            <span className="text-lg leading-none">{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
