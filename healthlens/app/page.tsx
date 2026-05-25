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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1
          className="text-4xl font-bold text-teal-700 mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          HealthLens
        </h1>
        <p className="text-gray-500 text-sm">
          CPIC-grounded Personal Health Analytics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700 text-center">
              {item.label}
            </span>
            <span className="text-[10px] text-gray-400 text-center leading-4">
              {item.detail}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
