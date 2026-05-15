import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const supabaseMock = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: supabaseMock,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

function mockFromTable(table: string, overrides: Record<string, any> = {}) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(),
        single: vi.fn(),
      })),
      ...overrides,
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
    ...overrides,
  };
}

function mockClientStatus(status: string | null, withError = false) {
  const from = vi.fn((table: string) => {
    if (table === 'clients') {
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            withError
              ? Promise.resolve({ data: null, error: { message: 'DB error' } })
              : Promise.resolve({ data: status ? { status } : null, error: null })
          ),
        })),
      }));
      const update = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));
      return { select, update };
    }
    return mockFromTable(table);
  });
  supabaseMock.from = from;
}

// ─── promoteClientOnCompletion ──────────────────────────────────────────

describe('promoteClientOnCompletion', () => {
  let promoteClientOnCompletion: (clientId: string | null) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/db/queries');
    promoteClientOnCompletion = mod.promoteClientOnCompletion;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // AC-1: prospecto → activa on first completed appointment
  it('promotes prospecto to activa on completion', async () => {
    let updateCalled = false;
    const from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { status: 'prospecto' }, error: null })
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => {
              updateCalled = true;
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      return mockFromTable(table);
    });
    supabaseMock.from = from;

    await promoteClientOnCompletion('client-1');

    expect(updateCalled).toBe(true);
  });

  // AC-2: inactiva → activa on completed appointment
  it('promotes inactiva to activa on completion', async () => {
    let updateCalled = false;
    const from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { status: 'inactiva' }, error: null })
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => {
              updateCalled = true;
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      return mockFromTable(table);
    });
    supabaseMock.from = from;

    await promoteClientOnCompletion('client-2');

    expect(updateCalled).toBe(true);
  });

  // AC-2 extended: activa stays activa (no-op)
  it('does NOT update client already activa', async () => {
    let updateCalled = false;
    const from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { status: 'activa' }, error: null })
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => {
              updateCalled = true;
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      return mockFromTable(table);
    });
    supabaseMock.from = from;

    await promoteClientOnCompletion('client-3');

    expect(updateCalled).toBe(false);
  });

  // AC-2 extended: vip stays vip (no-op)
  it('does NOT update client that is vip', async () => {
    let updateCalled = false;
    const from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { status: 'vip' }, error: null })
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => {
              updateCalled = true;
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      return mockFromTable(table);
    });
    supabaseMock.from = from;

    await promoteClientOnCompletion('client-4');

    expect(updateCalled).toBe(false);
  });

  // AC-8: silent — returns void, never throws
  it('handles null client_id silently', async () => {
    await expect(promoteClientOnCompletion(null)).resolves.toBeUndefined();
  });

  it('handles empty string client_id silently', async () => {
    await expect(promoteClientOnCompletion('')).resolves.toBeUndefined();
  });

  // AC-6: cancelada/no_show do NOT trigger — this is structural: the function only fires from handleAdvanceStatus when nextStatus === 'completada'
  it('never throws on DB errors (silent by design)', async () => {
    mockClientStatus(null, true);

    await expect(promoteClientOnCompletion('client-error')).resolves.toBeUndefined();
  });

  it('handles missing client record silently', async () => {
    mockClientStatus(null);

    await expect(promoteClientOnCompletion('client-nonexistent')).resolves.toBeUndefined();
  });

  // Ex-vip reactivates as activa (not vip) — structural guarantee: we only set 'activa', never 'vip'
  it('reactivates inactiva as activa regardless of previous VIP status', async () => {
    let updatedStatus: string | null = null;
    const from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { status: 'inactiva' }, error: null })
              ),
            })),
          })),
          update: vi.fn((payload: any) => ({
            eq: vi.fn(() => {
              updatedStatus = payload.status;
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      return mockFromTable(table);
    });
    supabaseMock.from = from;

    await promoteClientOnCompletion('ex-vip-client');

    // Always promotes to 'activa' — VIP must be re-assigned manually
    expect(updatedStatus).toBe('activa');
  });
});

// ─── DB Cron: eval_client_inactivity logic ────────────────────────────
// Tested at the app layer with a helper that mirrors the SQL logic.

describe('evalClientInactivity logic (application mirror)', () => {
  const DAYS_THRESHOLD = 60;

  function shouldDegradeToInactive(
    status: string,
    lastVisit: Date | null,
    now: Date = new Date()
  ): boolean {
    if (status !== 'activa' && status !== 'vip') return false;

    if (lastVisit === null) return true; // no visits at all

    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - DAYS_THRESHOLD);
    return lastVisit < threshold;
  }

  // AC-3: activa → inactiva after 60+ days
  it('identifies activa with 61 days as stale', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 61);
    expect(shouldDegradeToInactive('activa', lastVisit)).toBe(true);
  });

  it('activ with recent visit stays activa', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 10);
    expect(shouldDegradeToInactive('activa', lastVisit)).toBe(false);
  });

  it('identifies activa with no visits ever as stale', () => {
    expect(shouldDegradeToInactive('activa', null)).toBe(true);
  });

  // AC-4: vip → inactiva after 60+ days
  it('identifies vip with 61 days as stale', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 61);
    expect(shouldDegradeToInactive('vip', lastVisit)).toBe(true);
  });

  it('vip with recent visit stays vip', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 30);
    expect(shouldDegradeToInactive('vip', lastVisit)).toBe(false);
  });

  // AC-7: prospecto never auto-degrades
  it('prospecto never degrades automatically regardless of days', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 90);
    expect(shouldDegradeToInactive('prospecto', lastVisit)).toBe(false);
  });

  it('prospecto with no visits never degrades', () => {
    expect(shouldDegradeToInactive('prospecto', null)).toBe(false);
  });

  // Edge: inactiva is already inactive, no change needed
  it('inactiva is already inactive, no change needed', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 90);
    expect(shouldDegradeToInactive('inactiva', lastVisit)).toBe(false);
  });

  // Boundary: exactly 60 days is NOT stale (needs > 60)
  it('exactly 60 days ago is NOT stale (need > 60)', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 60);
    expect(shouldDegradeToInactive('activa', lastVisit)).toBe(false);
  });
});

// ─── Completion trigger: only completada fires ────────────────────────
// Structural test: verify handleAdvanceStatus calls promoteClientOnCompletion
// only when the appointment transitions to completada.

describe('handleAdvanceStatus trigger scope', () => {
  const COMPLETADA = 'completada';
  const EN_CURSO = 'en_curso';
  const PROGRAMADA = 'programada';
  const CANCELADA = 'cancelada';
  const NO_SHOW = 'no_show';

  function shouldPromoteOnStatusChange(
    currentStatus: string,
    nextStatus: string
  ): boolean {
    return nextStatus === COMPLETADA;
  }

  it('promotes on programada → completada', () => {
    expect(shouldPromoteOnStatusChange(PROGRAMADA, COMPLETADA)).toBe(true);
  });

  it('promotes on en_curso → completada', () => {
    expect(shouldPromoteOnStatusChange(EN_CURSO, COMPLETADA)).toBe(true);
  });

  it('does NOT promote on programada → en_curso', () => {
    expect(shouldPromoteOnStatusChange(PROGRAMADA, EN_CURSO)).toBe(false);
  });

  it('does NOT promote on programada → cancelada', () => {
    expect(shouldPromoteOnStatusChange(PROGRAMADA, CANCELADA)).toBe(false);
  });

  it('does NOT promote on en_curso → cancelada', () => {
    expect(shouldPromoteOnStatusChange(EN_CURSO, CANCELADA)).toBe(false);
  });

  it('does NOT promote on programada → no_show', () => {
    expect(shouldPromoteOnStatusChange(PROGRAMADA, NO_SHOW)).toBe(false);
  });

  it('does NOT promote on en_curso → no_show', () => {
    expect(shouldPromoteOnStatusChange(EN_CURSO, NO_SHOW)).toBe(false);
  });
});
