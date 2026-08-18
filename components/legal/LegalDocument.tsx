import type { LegalSection } from "@/lib/legal/termsContent";

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

// Estructura común a /legal/tyc y /legal/privacidad. Reemplaza al plugin
// @tailwindcss/typography (no instalado) con utilidades directas sobre
// <article> — evita sumar una dependencia nueva para dos páginas estáticas.
export function LegalDocument({ title, lastUpdated, intro, sections }: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl uppercase text-neutral-on-surface sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-neutral-on-surface-variant">
        Última actualización: {lastUpdated}
      </p>
      <p className="mt-8 text-base leading-relaxed text-neutral-on-surface">{intro}</p>

      <div className="mt-10 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl uppercase text-neutral-on-surface">
              {section.title}
            </h2>
            <div className="mt-3 flex flex-col gap-4">
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-relaxed text-neutral-on-surface-variant"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
