export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

export function formatServicePrice(params: {
  price_type: 'fixed' | 'variable';
  price: number;
  price_from: number | null;
  price_to: number | null;
}): string {
  const { price_type, price, price_from, price_to } = params;
  
  if (price_type === 'fixed') {
    return formatCurrency(price);
  }
  
  if (price_from === null || price_from === 0) {
    return 'Precio variable';
  }
  
  if (price_to === null || price_to === 0) {
    return `Desde ${formatCurrency(price_from)}`;
  }
  
  return `${formatCurrency(price_from)} - ${formatCurrency(price_to)}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfMonth() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
}

export function normalizePeruPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('51') && cleaned.length === 11) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.length === 9) {
    return `+51 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  if (phone.includes('+')) {
    return phone.trim();
  }
  return phone.trim() || null;
}

export function formatPeruPhoneForInput(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  let digits = cleaned;
  if (digits.startsWith('51') && digits.length >= 11) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('+51')) {
    digits = digits.slice(3);
  }
  const numericDigits = digits.replace(/\D/g, '');
  if (numericDigits.length <= 3) {
    return numericDigits;
  } else if (numericDigits.length <= 6) {
    return `${numericDigits.slice(0, 3)} ${numericDigits.slice(3)}`;
  } else {
    return `${numericDigits.slice(0, 3)} ${numericDigits.slice(3, 6)} ${numericDigits.slice(6, 9)}`;
  }
}

export function formatPeruPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const normalized = normalizePeruPhone(phone);
  return normalized || phone;
}

export function calculateServiceCommission(params: {
  servicePrice: number;
  artistCommissionPct: number | null;
  overrideFounderFixed: number | null;
  artistRoleName: string | null;
}): { artistCommission: number; founderShare: number } {
  const price = params.servicePrice || 0;
  const hasArtist = params.artistRoleName !== null && params.artistCommissionPct !== null;
  
  if (!hasArtist) {
    return { artistCommission: 0, founderShare: price };
  }
  
  const isFounder = params.artistRoleName === 'Dueña' || params.artistRoleName === 'Founder';
  
  if (isFounder) {
    return { artistCommission: price, founderShare: 0 };
  }
  
  if (params.overrideFounderFixed !== null) {
    const founderFixed = Math.min(params.overrideFounderFixed, price);
    return {
      artistCommission: price - founderFixed,
      founderShare: founderFixed,
    };
  }
  
  const pct = params.artistCommissionPct || 0;
  const artistCommission = Math.round(price * pct) / 100;
  return {
    artistCommission,
    founderShare: price - artistCommission,
  };
}

export function isAppointmentPastOrCompleted(appt: any): boolean {
  if (appt.status === 'completada' || appt.status === 'cancelada' || appt.status === 'no_show') {
    return true;
  }
  const endTime = new Date(appt.end_time || appt.start_time);
  return endTime < new Date();
}

export function getApptServiceEmoji(appt: any): string {
  const svc = appt.appointment_services?.[0]?.service;
  return svc?.category?.icon || '📋';
}
