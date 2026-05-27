import Link from "next/link";

const priorities = [
  {
    severity: "urgent" as const,
    title: "Review clopidogrel with your prescribing clinician",
    body: "Your CYP2C19 result suggests your body may not activate clopidogrel effectively. Because this medication is often used after heart procedures, this is worth discussing with the clinician who manages it.",
    saw: "CYP2C19 *2/*2 · clopidogrel listed",
    next: "Bring this to your prescribing clinician",
    boundary: "Do not stop or switch medication on your own",
  },
  {
    severity: "monitor" as const,
    title: "ApoB and LDL-C are worth reviewing",
    body: "Your blood test is the main signal here. ApoB and LDL-C are above the selected range, while hs-CRP adds inflammation context. Your genetics may add background, but do not prove the cause.",
    saw: "ApoB 125 · LDL-C 155 · hs-CRP 4.2",
    next: "Ask whether these should be tracked again",
    boundary: "This does not diagnose heart disease",
  },
  {
    severity: "reassuring" as const,
    title: "MTHFR variant not active in current blood test",
    body: "An MTHFR variant appears in the DNA file, but homocysteine is within range.",
    saw: "MTHFR variant · homocysteine 7.8",
    next: "No immediate action from genotype alone",
    boundary: "",
  },
];

const relationships = [
  {
    tone: "red",
    badge: "DNA-driven",
    title: "CYP2C19 + clopidogrel",
    text: "The gene-drug pair drives this alert. Blood markers are context only.",
  },
  {
    tone: "amber",
    badge: "Blood-first",
    title: "ApoB / LDL-C",
    text: "The current blood test is the actionable signal, not a genetic claim.",
  },
  {
    tone: "green",
    badge: "Not reflected",
    title: "MTHFR + homocysteine",
    text: "The genotype exists, but current blood markers do not show an active flag.",
  },
  {
    tone: "purple",
    badge: "Context only",
    title: "APOE lipid context",
    text: "Useful background for a clinician conversation, not a standalone action item.",
  },
];

type BloodMarker = {
  name: string;
  value: number;
  unit: string;
  refHigh: number;
  status: "above" | "normal";
};

const bloodMarkers: BloodMarker[] = [
  { name: "ApoB", value: 125, unit: "mg/dL", refHigh: 90, status: "above" },
  { name: "LDL-C", value: 155, unit: "mg/dL", refHigh: 100, status: "above" },
  { name: "hs-CRP", value: 4.2, unit: "mg/L", refHigh: 3.0, status: "above" },
  { name: "Homocysteine", value: 7.8, unit: "µmol/L", refHigh: 15, status: "normal" },
];

const evidence = [
  "Your DNA result was mapped through a structured CYP2C19 diplotype table.",
  "Your current medication context includes clopidogrel in this sample case.",
  "The app matched the gene-drug pair to CPIC / PharmGKB-style guidance.",
  "AI is used for plain-language wording only, not as the medical evidence source.",
];

function toneColor(tone: string) {
  const map: Record<string, { dot: string; badge: string }> = {
    red:    { dot: "bg-[#ff3b30]", badge: "bg-[#ff3b3020] text-[#d32f2f]" },
    amber:  { dot: "bg-[#ff9500]", badge: "bg-[#ff950020] text-[#b36200]" },
    green:  { dot: "bg-[#34c759]", badge: "bg-[#34c75920] text-[#1d8338]" },
    purple: { dot: "bg-[#af52de]", badge: "bg-[#af52de20] text-[#7a2eae]" },
  };
  return map[tone] ?? map.green;
}

function RangeBar({ value, refHigh, status }: { value: number; refHigh: number; status: "above" | "normal" }) {
  const scale = refHigh * 1.6;
  const refPct = (refHigh / scale) * 100;
  const valuePct = Math.min((value / scale) * 100, 97);
  return (
    <div className="relative mt-2 h-1.5 rounded-full bg-[#e5e5ea]">
      <div className="absolute h-full rounded-full bg-[#34c75930]" style={{ width: `${refPct}%` }} />
      <div
        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ${
          status === "above" ? "bg-[#ff3b30]" : "bg-[#34c759]"
        }`}
        style={{ left: `${valuePct}%` }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f2f2f7] pb-28 text-[#1c1c1e]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col">

        <header className="flex items-center justify-between px-4 pb-4 pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
              HealthLens
            </p>
            <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight">
              Your results
            </h1>
          </div>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#007aff] shadow-sm">
            Export
          </button>
        </header>

        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 pb-3 pt-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34c759]" />
              <span className="text-xs font-semibold text-[#8e8e93]">May 2026</span>
            </div>
            <h2 className="text-[17px] font-bold leading-snug">
              1 item to discuss, 2 markers to monitor, 1 DNA finding not active right now.
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#8e8e93]">
              Blood test shows what matters now. DNA shows what may matter. We separate the two.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#e5e5ea] border-t border-[#e5e5ea] px-2 py-3">
            <SummaryTile number="1" title="Discuss" text="medication-gene" />
            <SummaryTile number="2" title="Monitor" text="blood markers" />
            <SummaryTile number="1" title="Reassuring" text="genotype" />
          </div>
        </section>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          What matters now
        </p>
        <div className="mb-5 flex flex-col gap-3 px-4">
          {/* Urgent — dominates visually */}
          <article className="overflow-hidden rounded-2xl shadow-[0_4px_20px_rgba(255,59,48,0.20)]">
            <div className="bg-[#ff3b30] px-4 pb-4 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffb3af]">
                Discuss with clinician
              </p>
              <h3 className="mt-1 text-[19px] font-bold leading-snug text-white">
                {priorities[0].title}
              </h3>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-sm leading-5 text-[#3a3a3c]">{priorities[0].body}</p>
              <div className="mt-3 space-y-2 border-t border-[#e5e5ea] pt-3">
                <InfoRow label="What we saw" value={priorities[0].saw} />
                <InfoRow label="Next step" value={priorities[0].next} />
                <InfoRow label="Does not mean" value={priorities[0].boundary} />
              </div>
            </div>
          </article>

          {/* Monitor — standard */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex gap-3 px-4 py-4">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff9500]" />
              <div>
                <h3 className="text-[15px] font-semibold leading-snug">{priorities[1].title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-[#8e8e93]">{priorities[1].body}</p>
                <div className="mt-2.5 space-y-1.5 border-t border-[#e5e5ea] pt-2.5">
                  <InfoRow label="What we saw" value={priorities[1].saw} />
                  <InfoRow label="Next step" value={priorities[1].next} />
                </div>
              </div>
            </div>
          </article>

          {/* Reassuring — compact row */}
          <article className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="h-2 w-2 shrink-0 rounded-full bg-[#34c759]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{priorities[2].title}</p>
              <p className="mt-0.5 text-xs text-[#8e8e93]">{priorities[2].next}</p>
            </div>
            <span className="text-[#c7c7cc]">›</span>
          </article>
        </div>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Current blood signals
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            {bloodMarkers.map(({ name, value, unit, refHigh, status }) => (
              <div key={name} className="px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{name}</span>
                  <div>
                    <span
                      className={`text-[22px] font-bold tabular-nums leading-none tracking-tight ${
                        status === "above" ? "text-[#ff3b30]" : "text-[#1c1c1e]"
                      }`}
                    >
                      {value}
                    </span>
                    <span className="ml-1 text-xs text-[#8e8e93]">{unit}</span>
                  </div>
                </div>
                <RangeBar value={value} refHigh={refHigh} status={status} />
                <div className="mt-1 flex justify-between text-[10px] text-[#c7c7cc]">
                  <span>0</span>
                  <span>ref &lt;{refHigh} {unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          DNA × blood relationship
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            {relationships.map((item) => {
              const tone = toneColor(item.tone);
              return (
                <div key={item.title} className="flex gap-3 px-4 py-3">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-[#8e8e93]">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Questions for your clinician
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            <p className="px-4 py-3.5 text-sm leading-5 text-[#1c1c1e]">
              Is clopidogrel still appropriate given my CYP2C19 result?
            </p>
            <p className="px-4 py-3.5 text-sm leading-5 text-[#1c1c1e]">
              Should ApoB and LDL-C be monitored again after my current plan?
            </p>
            <p className="px-4 py-3.5 text-sm leading-5 text-[#1c1c1e]">
              Are there missing labs that would make this interpretation clearer?
            </p>
          </div>
        </section>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Evidence trace
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            {evidence.map((item, index) => (
              <div key={item} className="flex gap-3 px-4 py-3">
                <span className="text-xs font-bold tabular-nums text-[#c7c7cc]">{index + 1}</span>
                <p className="text-sm leading-5 text-[#3a3a3c]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-[#fff4e6] px-4 py-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#7c4b00]">What this does not mean</h2>
          <p className="mt-1.5 text-sm leading-5 text-[#9c6a00]">
            This is not a diagnosis and does not tell you to start, stop, or change medication. It prepares evidence-backed discussion points and shows where DNA is useful context.
          </p>
        </section>

        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#8e8e93]">
          Data controls
        </p>
        <section className="mx-4 mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="divide-y divide-[#e5e5ea]">
            <Link href="/upload" className="flex w-full items-center px-4 py-3.5 text-sm font-semibold text-[#007aff]">
              Add or update data
            </Link>
            <button className="w-full px-4 py-3.5 text-left text-sm font-semibold text-[#007aff]">
              Export report
            </button>
            <button className="w-full px-4 py-3.5 text-left text-sm font-semibold text-[#007aff]">
              View raw data
            </button>
            <button className="w-full px-4 py-3.5 text-left text-sm font-semibold text-[#ff3b30]">
              Delete all data
            </button>
          </div>
        </section>
      </div>

      {/* Bottom nav — parallel data types only, no action tab */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5ea] bg-white/95 px-5 pb-8 pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] justify-around">
          <BottomItem href="/" icon="✦" label="Results" active />
          <BottomItem href="/blood" icon="🩸" label="Blood" />
          <BottomItem href="/dna" icon="🧬" label="DNA" />
          <BottomItem href="/pgx" icon="💊" label="PGx" />
        </div>
      </nav>
    </main>
  );
}

function SummaryTile({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="px-3">
      <p className="text-[22px] font-bold tabular-nums tracking-tight">{number}</p>
      <p className="text-[11px] font-semibold text-[#1c1c1e]">{title}</p>
      <p className="text-[11px] text-[#8e8e93]">{text}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-[11px] font-semibold text-[#3a3a3c]">{label}</span>
      <span className="text-[11px] text-[#8e8e93]">{value}</span>
    </div>
  );
}

function BottomItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
        active ? "text-[#007aff]" : "text-[#8e8e93]"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
