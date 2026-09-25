export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  const compact = digits.startsWith("+") ? `+${digits.slice(1).replace(/\D/g, "")}` : digits.replace(/\D/g, "");
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  return null;
}

export function maskPhone(phone: string) {
  const local = phone.replace(/^\+91/, "");
  if (local.length < 6) return phone;
  return `+91 ${local.slice(0, 2)}XXX XX${local.slice(-2)}`;
}
