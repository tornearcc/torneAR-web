// Layout compartido de legales (§2 de WEB_SPECIFICATION.md). La tabla de
// contenidos y el "última actualización" viven en cada sección de
// LegalDocument; acá solo se fija el ancho de lectura común a ambos
// documentos.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface-lowest">{children}</div>;
}
