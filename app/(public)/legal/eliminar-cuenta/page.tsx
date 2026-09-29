import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import type { LegalSection } from "@/lib/legal/termsContent";

export const metadata: Metadata = {
  title: "Eliminar tu cuenta — torneAR",
  description: "Cómo eliminar tu cuenta de torneAR y qué pasa con tus datos.",
};

/**
 * Página pública de baja de cuenta. Google Play la exige en el formulario de
 * seguridad de datos («Delete account URL») para toda app que permite crear
 * una cuenta: tiene que explicar cómo pedir la baja sin depender de tener la
 * app instalada.
 *
 * El contenido repite la cláusula 8 de la Política de Privacidad
 * (lib/legal/privacyContent.ts) y lo que hace `delete_own_account` /
 * `anonymize_account` (migración 20260929120000). Si cambia la baja, cambian
 * los dos textos.
 */
const LAST_UPDATED = "29 de Septiembre, 2026";

const INTRO =
  "Podés eliminar tu cuenta de torneAR en cualquier momento, desde la app o pidiéndolo por correo. Acá te contamos cómo hacerlo y qué pasa con tus datos.";

const SECTIONS: LegalSection[] = [
  {
    title: "1. Desde la app",
    paragraphs: [
      "Abrí torneAR con tu cuenta y andá a Perfil → Preferencias → «Eliminar mi cuenta». Confirmá, y la baja se hace en el momento: se cierra tu sesión y ya no vas a poder volver a entrar con esa cuenta.",
    ],
  },
  {
    title: "2. Si no podés entrar a la app",
    paragraphs: [
      "Escribinos a tornearcc@gmail.com desde el correo con el que te registraste, con el asunto «Eliminar mi cuenta» y tu nombre de usuario. Hacemos la misma baja que desde la app y te avisamos por ese mismo correo cuando esté hecha.",
    ],
  },
  {
    title: "3. Qué se elimina",
    paragraphs: [
      "Tus datos personales directos se sobrescriben y se eliminan: nombre, nombre de usuario, fecha de nacimiento, género, pie hábil, zona, el correo asociado a la cuenta y el token de notificaciones de tu dispositivo.",
      "Tus fotos de perfil se borran de nuestros servidores. Si entraste con Apple, también revocamos el acceso de torneAR a tu Apple ID.",
      "El acceso a la cuenta queda bloqueado de forma permanente. La eliminación no se puede deshacer.",
    ],
  },
  {
    title: "4. Qué se conserva, y por qué",
    paragraphs: [
      "Para mantener la integridad de los torneos y no afectar a los otros jugadores, conservamos de forma anónima tu historial deportivo (resultados de partidos jugados, goles, MVPs y tu posición preferida en la cancha), los reportes de sistema y los mensajes de chat que hayas enviado, que van a aparecer a nombre de «Usuario eliminado».",
    ],
  },
  {
    title: "5. Más información",
    paragraphs: [
      "El detalle de qué datos tratamos y para qué está en la Política de Privacidad: https://tornear.vercel.app/legal/privacidad. Para cualquier consulta: tornearcc@gmail.com.",
    ],
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalDocument
      title="Eliminar tu cuenta"
      lastUpdated={LAST_UPDATED}
      intro={INTRO}
      sections={SECTIONS}
    />
  );
}
