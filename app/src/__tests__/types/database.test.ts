import {
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_CATEGORY_LABELS,
  getCategoryName,
  getCategoryColor,
  getCategoryIcon,
  getStaffSpecialtyNames,
  getCategoryIdsFromStaffSpecialties,
} from '@/types/database';

describe('labels', () => {
  describe('APPOINTMENT_STATUS_LABELS', () => {
    it('has all statuses', () => {
      expect(APPOINTMENT_STATUS_LABELS).toEqual({
        programada: 'Programada',
        en_curso: 'En curso',
        completada: 'Completada',
        cancelada: 'Cancelada',
        no_show: 'No-show',
      });
    });
  });

  describe('PAYMENT_KIND_LABELS', () => {
    it('has all payment kinds', () => {
      expect(PAYMENT_KIND_LABELS).toEqual({
        reserva: 'Reserva',
        pago_completo: 'Pago completo',
        pago_final: 'Pago final',
      });
    });
  });

  describe('PAYMENT_METHOD_LABELS', () => {
    it('has all payment methods', () => {
      expect(PAYMENT_METHOD_LABELS).toEqual({
        efectivo: 'Efectivo',
        tarjeta: 'Tarjeta',
        transferencia: 'Transferencia',
        yape_plin: 'Yape/Plin',
      });
    });
  });

  describe('PAYMENT_CATEGORY_LABELS', () => {
    it('has all payment categories', () => {
      expect(PAYMENT_CATEGORY_LABELS).toEqual({
        servicio: 'Servicio',
        insumo: 'Insumo',
        alquiler: 'Alquiler',
        marketing: 'Marketing',
        comisiones: 'Comisiones',
        otro: 'Otro',
      });
    });
  });
});

describe('getCategoryName', () => {
  it('returns category name when service has category', () => {
    const service = { category: { name: 'Uñas' } } as any;
    expect(getCategoryName(service)).toBe('Uñas');
  });

  it('returns "Sin categoría" when service is null', () => {
    expect(getCategoryName(null)).toBe('Sin categoría');
  });

  it('returns "Sin categoría" when service is undefined', () => {
    expect(getCategoryName(undefined)).toBe('Sin categoría');
  });

  it('returns "Sin categoría" when category is missing', () => {
    expect(getCategoryName({} as any)).toBe('Sin categoría');
  });
});

describe('getCategoryColor', () => {
  it('returns category color', () => {
    const service = { category: { color: '#FF0000' } } as any;
    expect(getCategoryColor(service)).toBe('#FF0000');
  });

  it('returns default color when no category', () => {
    expect(getCategoryColor(null)).toBe('#6B7280');
  });
});

describe('getCategoryIcon', () => {
  it('returns category icon', () => {
    const service = { category: { icon: '💅' } } as any;
    expect(getCategoryIcon(service)).toBe('💅');
  });

  it('returns default icon when no category', () => {
    expect(getCategoryIcon(null)).toBe('📋');
  });
});

describe('getStaffSpecialtyNames', () => {
  it('returns specialty names from staff', () => {
    const staff = {
      staff_specialties: [
        { category: { name: 'Uñas' } },
        { category: { name: 'Pestañas' } },
      ],
    } as any;
    expect(getStaffSpecialtyNames(staff)).toEqual(['Uñas', 'Pestañas']);
  });

  it('returns empty array when staff is null', () => {
    expect(getStaffSpecialtyNames(null)).toEqual([]);
  });

  it('returns empty array when staff is undefined', () => {
    expect(getStaffSpecialtyNames(undefined)).toEqual([]);
  });

  it('skips specialties without category name', () => {
    const staff = {
      staff_specialties: [
        { category: null },
        { category: { name: 'Uñas' } },
      ],
    } as any;
    expect(getStaffSpecialtyNames(staff)).toEqual(['Uñas']);
  });
});

describe('getCategoryIdsFromStaffSpecialties', () => {
  it('returns category ids from staff', () => {
    const staff = {
      staff_specialties: [
        { category_id: 'cat-1' },
        { category_id: 'cat-2' },
      ],
    } as any;
    expect(getCategoryIdsFromStaffSpecialties(staff)).toEqual(['cat-1', 'cat-2']);
  });

  it('returns empty array when staff is null', () => {
    expect(getCategoryIdsFromStaffSpecialties(null)).toEqual([]);
  });

  it('skips specialties without category_id', () => {
    const staff = {
      staff_specialties: [
        { category_id: null },
        { category_id: 'cat-1' },
      ],
    } as any;
    expect(getCategoryIdsFromStaffSpecialties(staff)).toEqual(['cat-1']);
  });
});
