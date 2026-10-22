import Image from "next/image";

/*
 * Maquetas (HTML/CSS, no capturas) de las pantallas de la app para «Cómo
 * funciona». Cada paso acepta `screenshotSrc`: si viene, se muestra esa imagen
 * en lugar de la maqueta. Para usar capturas reales, soltarlas en
 * public/embajadores/paso-1.png, paso-2.png y paso-3.png (proporción 9:13,
 * p. ej. 540x780) y pasar "/embajadores/paso-N.png" desde ComoFunciona.tsx.
 * Si cambia la pantalla en la app, cambiarla acá.
 */

export type StepMockProps = { screenshotSrc?: string; alt: string; description: string };

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[390px] w-[270px] overflow-hidden rounded-[2rem] border-4 border-surface-variant bg-surface-base shadow-xl">
      <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-surface-variant" />
      {children}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-base to-transparent" />
    </div>
  );
}

function Shell({ screenshotSrc, alt, description, children }: StepMockProps & { children: React.ReactNode }) {
  if (screenshotSrc) {
    return (
      <Image
        src={screenshotSrc}
        alt={alt}
        width={540}
        height={780}
        sizes="270px"
        className="mx-auto h-[390px] w-[270px] rounded-[2rem] border-4 border-surface-variant object-cover object-top shadow-xl"
      />
    );
  }
  return (
    <>
      <span className="sr-only">{description}</span>
      <div aria-hidden="true">
        <Phone>{children}</Phone>
      </div>
    </>
  );
}

function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded border-2 border-brand-primary bg-brand-primary text-[0.8rem] leading-none font-bold text-surface-lowest">
        ✓
      </span>
      <span className="text-[0.8rem] text-neutral-on-surface">{label}</span>
    </div>
  );
}

export function SignupMock(props: StepMockProps) {
  return (
    <Shell {...props}>
      <div className="px-4 pt-3">
        <p className="text-[0.7rem] font-semibold text-neutral-outline">Perfil → Embajadores</p>
        <p className="font-display mt-1 text-xl leading-none font-extrabold text-neutral-on-surface uppercase">
          Sé embajador
        </p>
        <p className="mt-1.5 text-[0.8rem] text-neutral-on-surface-variant">Ganá $5.000 por cada equipo que traigas.</p>
        <p className="mt-4 text-[0.75rem] font-bold text-neutral-on-surface">Tu Instagram</p>
        <div className="mt-1.5 rounded-lg border-2 border-brand-primary bg-surface-container px-3 py-2.5 text-[0.85rem] text-neutral-on-surface">
          @tu.usuario
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          <Check label="Soy mayor de 18" />
          <Check label="Leí y acepto las bases" />
        </div>
        <div className="mt-5 rounded-xl bg-brand-primary py-3 text-center text-[0.9rem] font-bold text-surface-lowest">
          Quiero ser embajador
        </div>
      </div>
    </Shell>
  );
}

export function ShareMock(props: StepMockProps) {
  return (
    <Shell {...props}>
      <div className="px-4 pt-3">
        <p className="font-display text-xl leading-none font-extrabold text-neutral-on-surface uppercase">Embajador</p>
        <div className="mt-3 rounded-xl border border-neutral-outline-variant bg-surface-container p-3">
          <p className="text-[0.85rem] font-bold text-neutral-on-surface">Invitá a un equipo</p>
          <p className="mt-0.5 text-[0.7rem] text-neutral-on-surface-variant">Mandales tu link por mensaje.</p>
          <div className="mt-2.5 rounded-lg bg-brand-primary py-2 text-center text-[0.8rem] font-bold text-surface-lowest">
            Compartir mi link
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="max-w-[88%] rounded-xl rounded-tr-sm bg-surface-high px-3 py-2 text-[0.75rem] leading-snug text-neutral-on-surface">
            <p>Creá tu equipo y en &quot;¿Quién los invitó?&quot; poné mi usuario jose</p>
            <p className="mt-1.5 break-all text-info-secondary underline">tornear.vercel.app/i/jose?emb=1</p>
            <p className="mt-1 text-right text-[0.6rem] text-neutral-outline">21:04</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function EarningsMock(props: StepMockProps) {
  return (
    <Shell {...props}>
      <div className="px-3 pt-3">
        <div className="rounded-xl border border-neutral-outline-variant bg-surface-high/95 p-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-brand-primary text-[0.6rem] font-extrabold text-surface-lowest">
              T
            </span>
            <span className="text-[0.65rem] text-neutral-outline">torneAR · ahora</span>
          </div>
          <p className="mt-1.5 text-[0.85rem] font-bold text-neutral-on-surface">¡Sumaste $5.000!</p>
          <p className="text-[0.75rem] text-neutral-on-surface-variant">Rimini CF jugó su primer partido en TorneAR.</p>
        </div>
      </div>
      <div className="mt-5 px-4">
        <p className="font-display text-xl leading-none font-extrabold text-neutral-on-surface uppercase">Embajador</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-container p-3">
            <p className="text-[0.7rem] text-neutral-outline">Ganado</p>
            <p className="font-display text-2xl leading-none font-extrabold text-brand-primary">$5.000</p>
          </div>
          <div className="rounded-xl bg-surface-container p-3">
            <p className="text-[0.7rem] text-neutral-outline">Pagado</p>
            <p className="font-display text-2xl leading-none font-extrabold text-neutral-on-surface">$0</p>
          </div>
        </div>
        <div className="mt-2 rounded-xl bg-surface-container p-3">
          <p className="text-[0.75rem] text-neutral-on-surface">1 de 5 equipos para el bono</p>
          <div className="mt-2 h-2 rounded-full bg-surface-variant">
            <div className="h-2 w-1/5 rounded-full bg-brand-gold" />
          </div>
        </div>
      </div>
    </Shell>
  );
}
