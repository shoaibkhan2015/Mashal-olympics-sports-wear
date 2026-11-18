export function getWhatsAppUrl(number: string, message?: string): string | null {
  const value = number.trim();
  if (!/^\+?[1-9][\d\s().-]*$/.test(value)) return null;

  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;

  const url = new URL(`https://wa.me/${digits}`);
  if (message) url.searchParams.set("text", message);
  return url.href;
}
