import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { TERMS_INTRO, TERMS_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/legal/termsContent";

export const metadata: Metadata = {
  title: "Términos y Condiciones — torneAR",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos y Condiciones"
      lastUpdated={TERMS_LAST_UPDATED}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
