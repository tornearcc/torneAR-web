/**
 * Bases del Programa de Embajadores (versión 2, 29/10/2026).
 *
 * Documento propio, aparte de los Términos y Condiciones (que no se tocan):
 * lo acepta quien se inscribe como embajador desde la app, y quien se había
 * inscripto con la versión 1 lo vuelve a aceptar desde la pantalla de
 * Embajadores. Texto de docs/legales/TorneAR_Programa_de_Embajadores_V2_Final.docx
 * (carpeta del proyecto, fuera de los repos). La versión (`ambassador_terms_version` en `app_settings`)
 * es 2; si se cambia el texto, subir las dos.
 */

import type { LegalSection } from "./termsContent";

export const AMBASSADOR_TERMS_VERSION = 2;

export const AMBASSADOR_TERMS_LAST_UPDATED = "29 de Octubre, 2026";

export const AMBASSADOR_TERMS_INTRO =
  "Estas son las bases del Programa de Embajadores de torneAR (versión 2). Reemplazan a la versión 1, vigente desde el 22 de octubre de 2026. Inscribirte desde la app implica aceptarlas. Te recomendamos leerlas completas antes de anotarte.";

export const AMBASSADOR_TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Organizadores y documentos aplicables",
    paragraphs: [
      "El Programa de Embajadores (el «Programa») es organizado por Juan Ignacio Sacco Moriconi y Agustín Saladino, en su carácter de titulares y operadores conjuntos de la plataforma tecnológica TorneAR (los «Organizadores»). Contacto: tornearcc@gmail.com. Estas Bases complementan los Términos y Condiciones de Uso y la Política de Privacidad vigentes de TorneAR. En lo específicamente relativo al Programa prevalecerán estas Bases, sin perjuicio de las normas imperativas aplicables.",
    ],
  },
  {
    title: "2. Naturaleza y finalidad",
    paragraphs: [
      "El Programa constituye una iniciativa voluntaria de promoción y recomendación de la aplicación, mediante incentivos económicos sujetos al cumplimiento de condiciones objetivas. La administración de este Programa no convierte a los Organizadores en organizadores, coorganizadores, árbitros ni responsables de los partidos o actividades deportivas que los usuarios acuerden por su cuenta. La participación no confiere facultades de representación de TorneAR ni autoriza a asumir obligaciones en su nombre.",
      "La participación en el Programa no establece por sí sola una relación laboral, de agencia o representación. La calificación jurídica de cualquier vínculo dependerá de sus circunstancias reales y de la normativa imperativa aplicable.",
    ],
  },
  {
    title: "3. Vigencia y cupo",
    paragraphs: [
      "El Programa comenzó el 22 de octubre de 2026 y permanecerá vigente hasta que se alcance el cupo de cien (100) equipos referidos que hayan disputado su primer partido válido, salvo finalización anticipada comunicada por la aplicación y el sitio web.",
      "Para determinar la prioridad dentro del cupo, se utilizará como criterio la fecha y hora de finalización del primer partido válido confirmado y registrado por el sistema, con desempate verificable. La mera inscripción o invitación no garantiza reserva de cupo. Los incentivos válidamente devengados antes del cierre conservarán su exigibilidad, sujetos a la verificación prevista en estas Bases.",
    ],
  },
  {
    title: "4. Participantes e inscripción",
    paragraphs: [
      "Podrán participar personas humanas mayores de dieciocho (18) años que mantengan una cuenta personal activa en TorneAR, se inscriban voluntariamente desde la aplicación, informen su usuario de Instagram, sigan la cuenta oficial @tornear.app y acepten expresamente estas Bases. No es necesario integrar un equipo para inscribirse. Quedan excluidas las cuentas falsas, duplicadas o utilizadas por terceros, y quienes incurran en las conductas prohibidas previstas aquí.",
      "La aceptación se recabará mediante una acción afirmativa identificable, no preseleccionada, y se conservará evidencia razonable de la cuenta, fecha, hora y versión aceptada, conforme a la Política de Privacidad.",
    ],
  },
  {
    title: "5. Equipo referido y atribución",
    paragraphs: [
      "Se considerará «equipo referido» al equipo nuevo cuyo capitán consigne correctamente el usuario del embajador en el campo «¿Quién los invitó?» al crearlo, o dentro de las veinticuatro (24) horas siguientes, siempre antes de disputar cualquier partido. Transcurrido ese plazo o disputado el primer partido, la atribución no podrá agregarse ni modificarse, salvo corrección de un error técnico comprobado. A los efectos del Programa, un equipo solo será considerado «nuevo» si, al momento de disputar su primer partido válido, todos los integrantes de su plantel registrado no han disputado previamente ningún partido en TorneAR con otro equipo, bajo ningún formato. Si al menos uno de sus integrantes registra un partido previo con otro equipo, el equipo no será considerado nuevo a los fines del Programa. Los partidos amistosos que el propio equipo referido haya disputado antes de su primer partido válido no afectan esta condición.",
      "No podrá atribuirse un equipo al embajador si este lo integra o lo integró anteriormente. Tampoco devengará incentivo si el embajador integra el plantel del equipo referido al momento del partido computable. Cada equipo podrá atribuirse a un solo embajador; ante disputas se atenderá al registro electrónico verificable y se ofrecerá un canal de revisión.",
    ],
  },
  {
    title: "6. Incentivos económicos",
    paragraphs: [
      "a) Incentivo base. El embajador devengará PESOS CINCO MIL ($5.000) por cada equipo referido que dispute su primer partido válido, cumpla las condiciones de estas Bases y resulte comprendido dentro del cupo aplicable. Cada equipo referido podrá generar este incentivo una única vez. La carga de un resultado, por sí sola, no constituye derecho al incentivo si faltan los demás requisitos.",
      "b) Adicional de debut. El embajador podrá integrar uno o más equipos en TorneAR sin que ello afecte su participación en el Programa. En el caso de que el embajador integre un único equipo, este se considerará su «equipo propio»; si integra varios, deberá seleccionar uno en la aplicación. Si el primer partido válido de su equipo propio, desde el inicio del Programa y desde su designación como tal, se disputa contra un equipo referido por él que genere el incentivo base previsto en este artículo, devengará un adicional único de PESOS CINCO MIL ($5.000). El embajador deberá integrar su equipo propio al finalizar ese partido. Si el primer partido válido de su equipo propio se juega contra otro rival, el adicional no se devengará.",
      "c) Bono por cinco equipos. Cuando un embajador acumule cinco (5) equipos referidos que hayan generado el incentivo base, devengará un bono por única vez de PESOS CINCO MIL ($5.000). Si antes del pago se invalida justificadamente un incentivo y deja de alcanzarse este umbral, el bono pendiente quedará suspendido hasta recuperar la cantidad requerida. No se reclamarán devoluciones de bonos ya abonados sin causa legal suficiente y procedimiento de revisión.",
      "d) Bono por diez equipos. Cuando un embajador acumule diez (10) equipos referidos que hayan generado el incentivo base, devengará un segundo bono por única vez de PESOS CINCO MIL ($5.000). Si antes del pago se invalida justificadamente un incentivo y deja de alcanzarse este umbral, el bono pendiente quedará suspendido hasta recuperar la cantidad requerida. No se reclamarán devoluciones de bonos ya abonados sin causa legal suficiente y procedimiento de revisión.",
      "e) Sin tope individual. Cada embajador podrá generar tantos incentivos como equipos referidos válidos consiga durante la vigencia del Programa, sin un tope individual de equipos, hasta agotarse el cupo global previsto en estas Bases.",
    ],
  },
  {
    title: "7. Partido válido y controles objetivos",
    paragraphs: [
      "Se considerará «partido válido» exclusivamente al partido por Ranking finalizado con resultado cargado en la aplicación, check-in de ambos equipos y cantidad mínima de titulares con cuentas personales propias correspondiente al formato disputado: cinco (5) para Fútbol 5; seis (6) para Fútbol 6; siete (7) para Fútbol 7; ocho (8) para Fútbol 8; nueve (9) para Fútbol 9; y once (11) para Fútbol 11. Los partidos amistosos no serán computables a los fines del Programa. Tampoco se computarán partidos contra equipos de demostración de las tiendas.",
      "Cada jugador podrá computarse una sola vez en todo el Programa. A efectos de alcanzar el mínimo requerido no se contarán el propio embajador ni los integrantes de su equipo propio. Los resultados rectificados, anulados o afectados por fraude podrán revisarse con fundamento documentado. Estas verificaciones tienen exclusivamente fines de liquidación del Programa y no implican dirección ni certificación deportiva general por TorneAR.",
    ],
  },
  {
    title: "8. Liquidación y pago",
    paragraphs: [
      "Los incentivos validados serán abonados mediante transferencia bancaria, Mercado Pago u otro medio electrónico habilitado por los Organizadores, exclusivamente a una cuenta, alias, CBU o CVU de titularidad del participante. El pago se realizará dentro de los siete (7) días corridos desde que el partido válido quede registrado en la aplicación, siempre que el participante haya proporcionado correctamente la información necesaria para efectuarlo y cumplido los restantes requisitos del Programa.",
      "Si existiera algún dato faltante o inconsistente que impidiera realizar el pago, el participante será informado y el incentivo permanecerá pendiente hasta su regularización. Una vez subsanada la situación, el pago se efectuará dentro de los siete (7) días corridos siguientes.",
      "Los Organizadores conservarán un registro razonable de cada incentivo abonado, incluyendo el participante beneficiario, el equipo referido que originó el incentivo, la fecha de validación, el importe y la constancia del medio de pago utilizado.",
      "Los participantes deberán proporcionar, cuando resulte necesario, los datos de identificación y condición tributaria que correspondan. Cuando la normativa aplicable exija la emisión de factura, recibo u otro comprobante fiscal por parte del participante, los Organizadores podrán requerir dicho documento como respaldo del pago.",
      "Cada participante será responsable del cumplimiento de las obligaciones tributarias que correspondan a los ingresos obtenidos mediante su participación en el Programa, sin perjuicio de las obligaciones de registración, información, retención o documentación que legalmente pudieran corresponder a los Organizadores.",
      "La participación de los Embajadores en el Programa es independiente y por iniciativa propia, sin subordinación técnica, jurídica ni económica respecto de TorneAR o de sus titulares y/o Organizadores.",
      "Los Embajadores desarrollan libremente sus actividades, sin sujeción a horarios, exclusividad, instrucciones de carácter laboral, obligación de prestar servicios personales ni exigencia de resultados mínimos. Asimismo, no poseen facultades de representación ni se encuentran autorizados a asumir obligaciones en nombre de TorneAR o de sus Titulares.",
      "La participación en el Programa no implica, por sí misma, la constitución de una relación laboral, de dependencia, de agencia ni de representación entre los Embajadores y TorneAR, Juan Ignacio Sacco Moriconi o Agustín Saladino.",
      "Los incentivos económicos se generan exclusivamente por el cumplimiento de las condiciones objetivas establecidas en estas Bases y no constituyen, por su sola denominación o previsión contractual, salario ni remuneración laboral, sin perjuicio de la calificación jurídica que corresponda conforme a las circunstancias efectivas de la relación y a la legislación aplicable.",
    ],
  },
  {
    title: "9. Prevención del fraude y medidas",
    paragraphs: [
      "Se prohíbe crear o utilizar cuentas ficticias o duplicadas, simular partidos o check-in, manipular resultados, atribuir invitaciones falsas, reutilizar indebidamente jugadores o realizar cualquier maniobra destinada a obtener pagos sin cumplir los requisitos. Ante indicios razonables, los Organizadores podrán suspender preventivamente la liquidación y solicitar aclaraciones. El rechazo definitivo de un incentivo o la suspensión o exclusión del participante del Programa requerirán una causa objetiva, comunicación al interesado y oportunidad razonable de formular descargo, salvo urgencia fundada. Las medidas serán proporcionales, sin afectar derechos inderogables. Los Organizadores podrán rechazar el incentivo cuando exista evidencia razonable de que el equipo referido es sustancialmente un equipo ya registrado o que jugaba en TorneAR, aunque haya modificado su nombre, capitán o composición.",
    ],
  },
  {
    title: "10. Consultas, reclamos y revisión",
    paragraphs: [
      "El embajador podrá formular consultas o solicitar revisión de la atribución de equipos, validación de partidos, liquidación de incentivos o medidas antifraude escribiendo a tornearcc@gmail.com, con identificación de su cuenta y del hecho cuestionado. Los Organizadores acusarán recibo y responderán fundadamente dentro de siete (7) días hábiles, sin perjuicio de los derechos legales que correspondan.",
    ],
  },
  {
    title: "11. Datos personales y ranking",
    paragraphs: [
      "Para administrar el Programa se tratarán, conforme a la sección 11 de la Política de Privacidad vigente, el nombre, correo electrónico, usuario de Instagram, equipos referidos, incentivos generados y, cuando exista un incentivo a cobrar, alias o CBU/CVU. El usuario de Instagram se utilizará exclusivamente para verificar el seguimiento de la cuenta oficial @tornear.app. La verificación será realizada por los Organizadores al momento de validar el incentivo, mediante la búsqueda del usuario informado entre los seguidores de la cuenta oficial. Si por limitaciones técnicas de Instagram no fuera posible realizar dicha verificación, podrá solicitarse al participante una captura de pantalla u otra evidencia razonable. No se solicitarán contraseñas ni credenciales de acceso a Instagram. La información se conservará durante el plazo indicado en la Política de Privacidad y el necesario para cumplir obligaciones legales aplicables.",
      "La aparición en el ranking público será estrictamente opcional, estará desactivada por defecto y podrá revocarse para futuras publicaciones desde la aplicación. Antes de optar por ella, se informará que podrán exhibirse el usuario de la plataforma, la fotografía de perfil, la cantidad de equipos referidos y los importes obtenidos. No se publicarán el nombre real, correo electrónico ni usuario de Instagram. La opción de aparecer en el ranking no condiciona la participación ni el cobro. Cualquier utilización adicional de imagen con fines publicitarios requerirá autorización específica y separada, cuando corresponda.",
      "La aceptación de estas Bases no reemplaza los consentimientos específicos exigibles para tratamientos de datos particulares. Los participantes podrán ejercer sus derechos de acceso, rectificación, actualización o supresión mediante tornearcc@gmail.com, de acuerdo con la Política de Privacidad y la legislación aplicable.",
    ],
  },
  {
    title: "12. Baja voluntaria",
    paragraphs: [
      "El embajador podrá solicitar la baja del Programa escribiendo a tornearcc@gmail.com. La baja impedirá generar nuevos incentivos desde su efectivización, pero no extinguirá los incentivos válidamente devengados con anterioridad. La salida del ranking podrá gestionarse independientemente desde la aplicación. La conservación o eliminación de datos se regirá por la Política de Privacidad y las obligaciones legales pertinentes.",
    ],
  },
  {
    title: "13. Modificaciones y terminación anticipada",
    paragraphs: [
      "Los Organizadores podrán modificar estas Bases por motivos operativos, legales o de prevención de abusos, mediante comunicación clara en la aplicación y el sitio web. Las modificaciones sustanciales que afecten condiciones de participación o incentivos futuros se comunicarán con antelación razonable y, cuando corresponda, requerirán nueva aceptación. Ningún cambio ni finalización anticipada afectará retroactivamente incentivos válidamente devengados. Se conservará un historial de versiones y sus fechas de vigencia. Los embajadores inscriptos bajo la versión 1 deberán aceptar esta versión desde la aplicación para seguir generando incentivos.",
    ],
  },
  {
    title: "14. Ley aplicable y competencia",
    paragraphs: [
      "Estas Bases se interpretarán conforme a las leyes de la República Argentina. Las controversias serán sometidas a los tribunales legalmente competentes, respetando las normas imperativas de protección de consumidores y usuarios y las reglas de competencia que resulten aplicables. En ausencia de competencia imperativa distinta, corresponderán los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.",
    ],
  },
  {
    title: "15. Aceptación y publicidad",
    paragraphs: [
      "La inscripción voluntaria mediante el mecanismo habilitado en la aplicación implica la aceptación expresa de la versión vigente de estas Bases, que estarán disponibles para consulta permanente. El Programa no autoriza al embajador a utilizar marcas, logos o materiales de TorneAR fuera de las modalidades expresamente habilitadas por los Organizadores.",
      "El embajador no podrá realizar afirmaciones falsas o engañosas sobre TorneAR, prometer beneficios no previstos en estas Bases, cobrar dinero en nombre de TorneAR ni presentarse como empleado, agente o representante de los Organizadores.",
    ],
  },
];
