import Link from "next/link";

const items = [
  {
    href: "/upload",
    icon: "🏠",
    label: "PGx Input",
    detail: "Genotype, medication, indication",
  },
  {
    href: "/blood",
    icon: "🩸",
    label: "Blood Results",
    detail: "Population comparison",
  },
  {
    href: "/dna",
    icon: "🧬",
    label: "DNA Mapping",
    detail: "Diplotype to phenotype",
  },
  {
    href: "/pgx",
    icon: "💊",
    label: "Drug Safety",
    detail: "CPIC rule check",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1
          className="text-4xl font-bold text-[#246b63] mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          HealthLens
        </h1>
        <p className="text-slate-500 text-sm">
          CPIC-grounded Personal Health Analytics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-[#dfe8e3] rounded-[1.75rem] p-5 flex flex-col items-center gap-2 shadow-[0_8px_22px_rgba(45,65,59,0.06)] hover:shadow-[0_12px_28px_rgba(45,65,59,0.09)] transition-shadow"
          >
            <span className="text-3xl rounded-2xl bg-[#eef5f2] w-12 h-12 flex items-center justify-center">
              {item.icon}
            </span>
            <span className="text-sm font-semibold text-slate-700 text-center">
              {item.label}
            </span>
            <span className="text-[10px] text-slate-400 text-center leading-4">
              {item.detail}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
