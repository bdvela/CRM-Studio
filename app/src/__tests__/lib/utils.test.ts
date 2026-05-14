import {
  cn,
  formatCurrency,
  formatServicePrice,
  formatDate,
  formatTime,
  normalizePeruPhone,
  formatPeruPhoneForInput,
  isAppointmentPastOrCompleted,
  startOfToday,
  startOfWeek,
  startOfMonth,
} from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy values', () => {
    expect(cn(false, undefined, null)).toBe('');
  });

  it('handles single argument', () => {
    expect(cn('a')).toBe('a');
  });
});

describe('formatCurrency', () => {
  it('formats amount with S/ prefix', () => {
    expect(formatCurrency(99.99)).toBe('S/ 99.99');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('S/ 0.00');
  });

  it('handles whole numbers', () => {
    expect(formatCurrency(100)).toBe('S/ 100.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('S/ 1234567.89');
  });
});

describe('formatServicePrice', () => {
  it('formats fixed price', () => {
    expect(formatServicePrice({ price_type: 'fixed', price: 50, price_from: null, price_to: null })).toBe('S/ 50.00');
  });

  it('returns "Precio variable" when price_from is null', () => {
    expect(formatServicePrice({ price_type: 'variable', price: 0, price_from: null, price_to: null })).toBe('Precio variable');
  });

  it('returns "Precio variable" when price_from is 0', () => {
    expect(formatServicePrice({ price_type: 'variable', price: 0, price_from: 0, price_to: null })).toBe('Precio variable');
  });

  it('returns "Desde S/ X" when price_to is null', () => {
    expect(formatServicePrice({ price_type: 'variable', price: 0, price_from: 30, price_to: null })).toBe('Desde S/ 30.00');
  });

  it('returns "Desde S/ X" when price_to is 0', () => {
    expect(formatServicePrice({ price_type: 'variable', price: 0, price_from: 30, price_to: 0 })).toBe('Desde S/ 30.00');
  });

  it('returns range when both prices present', () => {
    expect(formatServicePrice({ price_type: 'variable', price: 0, price_from: 30, price_to: 80 })).toBe('S/ 30.00 - S/ 80.00');
  });
});

describe('formatDate', () => {
  it('formats a date string in es-PE locale', () => {
    const result = formatDate('2024-03-15T10:00:00');
    expect(result).toContain('2024');
    expect(result).toContain('mar');
  });
});

describe('formatTime', () => {
  it('formats time with hour12', () => {
    const result = formatTime('2024-03-15T10:30:00');
    expect(result).toContain('10');
  });
});

describe('normalizePeruPhone', () => {
  it('returns null for null input', () => {
    expect(normalizePeruPhone(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizePeruPhone(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizePeruPhone('')).toBeNull();
  });

  it('normalizes 9-digit phone', () => {
    expect(normalizePeruPhone('999888777')).toBe('+51 999 888 777');
  });

  it('strips country code +51 prefix', () => {
    expect(normalizePeruPhone('51999888777')).toBe('+51 999 888 777');
  });

  it('handles phone with spaces', () => {
    expect(normalizePeruPhone('999 888 777')).toBe('+51 999 888 777');
  });

  it('handles phone with +51 prefix with spaces', () => {
    expect(normalizePeruPhone('+51 999 888 777')).toBe('+51 999 888 777');
  });

  it('returns phone as-is if it has + but not 9 digits', () => {
    expect(normalizePeruPhone('+123456')).toBe('+123456');
  });

  it('returns trimmed string for invalid formats without +', () => {
    expect(normalizePeruPhone('  123  ')).toBe('123');
  });
});

describe('formatPeruPhoneForInput', () => {
  it('returns empty for null', () => {
    expect(formatPeruPhoneForInput(null)).toBe('');
  });

  it('formats 9 digits with spaces', () => {
    expect(formatPeruPhoneForInput('999888777')).toBe('999 888 777');
  });

  it('strips 51 prefix and formats', () => {
    expect(formatPeruPhoneForInput('51999888777')).toBe('999 888 777');
  });

  it('handles partial numbers', () => {
    expect(formatPeruPhoneForInput('999')).toBe('999');
    expect(formatPeruPhoneForInput('999888')).toBe('999 888');
  });
});

describe('isAppointmentPastOrCompleted', () => {
  it('returns true for completed status', () => {
    expect(isAppointmentPastOrCompleted({ status: 'completada', start_time: new Date().toISOString() })).toBe(true);
  });

  it('returns true for cancelled status', () => {
    expect(isAppointmentPastOrCompleted({ status: 'cancelada', start_time: new Date().toISOString() })).toBe(true);
  });

  it('returns true for no_show status', () => {
    expect(isAppointmentPastOrCompleted({ status: 'no_show', start_time: new Date().toISOString() })).toBe(true);
  });

  it('returns true for past end_time', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isAppointmentPastOrCompleted({ status: 'programada', start_time: past, end_time: past })).toBe(true);
  });

  it('returns false for future appointment', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isAppointmentPastOrCompleted({ status: 'programada', start_time: future, end_time: future })).toBe(false);
  });
});

describe('startOfToday', () => {
  it('returns ISO string at start of day', () => {
    const result = startOfToday();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const d = new Date(result);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('startOfWeek', () => {
  it('returns ISO string', () => {
    const result = startOfWeek();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const d = new Date(result);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('startOfMonth', () => {
  it('returns ISO string for first of month', () => {
    const result = startOfMonth();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const d = new Date(result);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
