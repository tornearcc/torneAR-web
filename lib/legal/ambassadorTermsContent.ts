/**
 * Bases del Programa de Embajadores (versión 1, 21/10/2026).
 *
 * Documento propio, aparte de los Términos y Condiciones (que no se tocan):
 * lo acepta sólo quien se inscribe como embajador desde la app. Texto del
 * «Borrador de bases» de knowledge/planes/2026-10-21-programa-embajadores-explicado.html.
 * La versión (`ambassador_terms_version` en `app_config`) arranca en 1; si se
 * cambia el texto, subir las dos.
 */

import type { LegalSection } from "./termsContent";

export const AMBASSADOR_TERMS_VERSION = 1;

export const AMBASSADOR_TERMS_LAST_UPDATED = "21 de Octubre, 2026";

export const AMBASSADOR_TERMS_INTRO =
  "Estas son las bases del Programa de Embajadores de torneAR (versión 1). Inscribirte desde la app implica aceptarlas. Te recomendamos leerlas completas antes de anotarte.";

export const AMBASSADOR_TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Organizador",
    paragraphs: ["El Programa de Embajadores lo organiza TorneAR. Contacto: tornearcc@gmail.com."],
  },
  {
    title: "2. Vigencia",
    paragraphs: [
      "Desde la fecha de lanzamiento anunciada en la app y en la web, hasta que 100 equipos traídos jueguen su primer partido válido. TorneAR puede terminarlo antes avisando en la app y en la web; los premios ya generados se pagan igual.",
    ],
  },
  {
    title: "3. Quién participa",
    paragraphs: [
      "Personas mayores de 18 años con cuenta en TorneAR que se inscriban desde la app, carguen su usuario de Instagram, sigan a @tornear.app y acepten estas bases. No hace falta tener equipo.",
    ],
  },
  {
    title: "4. Equipo traído",
    paragraphs: [
      "Es un equipo nuevo cuyo capitán carga el usuario del embajador en «¿Quién los invitó?» al crearlo. Se puede cargar hasta 24 horas después de creado el equipo y siempre que no haya jugado ningún partido. Después no se puede agregar ni cambiar. El embajador no puede traer un equipo del que es o fue integrante, y el equipo traído no genera premio si el embajador está en su plantel cuando se juega el partido.",
    ],
  },
  {
    title: "5. Premio por equipo traído",
    paragraphs: [
      "$5.000 por cada equipo traído que juegue su primer partido válido, contra cualquier equipo de la app. Cada equipo traído genera este premio una sola vez.",
    ],
  },
  {
    title: "6. Extra de debut",
    paragraphs: [
      "Si el embajador tiene un equipo propio en la app (se asigna automáticamente cuando integra un solo equipo; si integra varios, lo elige él) y el primer partido válido de ese equipo es contra un equipo traído por él, suma $5.000 más, una sola vez. Si ese primer partido es contra otro equipo, el extra no se paga. El embajador tiene que ser integrante de su equipo al terminar el partido.",
    ],
  },
  {
    title: "7. Bonos por cantidad de equipos",
    paragraphs: [
      "Cuando el embajador junta 5 equipos traídos que ya generaron su premio, suma $5.000 más; cuando junta 10, suma otros $5.000. Cada bono se paga una sola vez. Si se rechaza el premio de alguno de esos equipos y el embajador baja de 5 o de 10, el bono que todavía no se pagó queda sin efecto hasta que vuelva a llegar.",
    ],
  },
  {
    title: "8. Partido válido",
    paragraphs: [
      "Un partido terminado y con resultado cargado en la app, con check-in de los dos equipos, y donde cada equipo tiene como mínimo la cantidad de titulares del formato jugado (5 en Fútbol 5, 6 en Fútbol 6, 7 en Fútbol 7, 8 en Fútbol 8, 9 en Fútbol 9 y 11 en Fútbol 11), integrantes del equipo con cuenta propia.",
    ],
  },
  {
    title: "9. Un jugador, un equipo",
    paragraphs: [
      "Para cada embajador, un mismo jugador cuenta para un solo equipo. Para alcanzar el mínimo de un equipo traído no cuentan el embajador, los integrantes de su equipo propio ni los jugadores que ya se contaron para otro equipo traído por él.",
    ],
  },
  {
    title: "10. Pago",
    paragraphs: [
      "Por transferencia o Mercado Pago, al alias o CBU que cargue el embajador a su nombre, dentro de los 7 días de generado el premio y verificado que sigue a @tornear.app. Sin alias o sin el follow verificado, el premio queda pendiente hasta que se completen.",
    ],
  },
  {
    title: "11. Controles",
    paragraphs: [
      "TorneAR revisa cada premio antes de pagarlo y puede rechazarlo, o suspender al embajador, si detecta cuentas falsas, partidos armados, check-ins simulados o cualquier otra forma de engaño. El rechazo se informa al embajador.",
    ],
  },
  {
    title: "12. Datos personales",
    paragraphs: [
      "Para el programa se usan el nombre, el mail, el usuario de Instagram y el alias o CBU del embajador, según la Política de Privacidad de TorneAR. El usuario, la foto, los equipos traídos y el monto ganado aparecen en el ranking público solo si el embajador lo elige.",
    ],
  },
  {
    title: "13. Aceptación",
    paragraphs: [
      "Inscribirse implica aceptar estas bases. TorneAR puede modificarlas avisando en la app; los cambios no afectan los premios ya generados.",
    ],
  },
];
