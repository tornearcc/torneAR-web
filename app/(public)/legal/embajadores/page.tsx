import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  AMBASSADOR_TERMS_INTRO,
  AMBASSADOR_TERMS_LAST_UPDATED,
  AMBASSADOR_TERMS_SECTIONS,
} from "@/lib/legal/ambassadorTermsContent";

export const metadata: Metadata = {
  title: "Bases del Programa de Embajadores — torneAR",
  description: "Las bases completas del Programa de Embajadores de torneAR: premios, requisitos, pagos y controles.",
};

export default function AmbassadorTermsPage() {
  return (
    <LegalDocument
      title="Bases del Programa de Embajadores"
      lastUpdated={AMBASSADOR_TERMS_LAST_UPDATED}
      intro={AMBASSADOR_TERMS_INTRO}
      sections={AMBASSADOR_TERMS_SECTIONS}
    />
  );
}
