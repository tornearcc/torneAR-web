import { toast } from "sonner";

/** Copia al portapapeles y avisa con un toast; si el navegador lo niega, muestra el texto. */
export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copiado.`);
  } catch {
    toast.error("No se pudo copiar", { description: text });
  }
}
