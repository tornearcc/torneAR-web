import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  PRIVACY_INTRO,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
} from "@/lib/legal/privacyContent";

export const metadata: Metadata = {
  title: "Política de Privacidad — torneAR",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidad"
      lastUpdated={PRIVACY_LAST_UPDATED}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
