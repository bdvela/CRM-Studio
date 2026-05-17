export const DEPOSIT_AMOUNT = 20;

// Cache TTLs (ms). Stale window = 3x TTL (in cachedQuery).
// Fast (10-15s): data that changes with every user action (payments, appointments, clients)
// Medium (30s): dashboard aggregates — expensive to compute, tolerate slight lag
// Slow (60s): reference data that rarely changes (services, staff, roles, categories)
export const CACHE_TTL = {
  PAYMENTS: 10_000,
  CLIENTS: 15_000,
  APPOINTMENT: 15_000,
  COMMISSION_REPORT: 15_000,
  STAFF_PERFORMANCE: 15_000,
  APPOINTMENTS: 30_000,
  DASHBOARD: 30_000,
  MONTHLY_REPORT: 30_000,
  TOP_SERVICES: 30_000,
  TOP_ARTISTS: 30_000,
  INCOME_BY_METHOD: 30_000,
  EXPENSES_BY_CATEGORY: 30_000,
  INACTIVE_CLIENTS: 30_000,
  NEW_CLIENTS: 30_000,
  STAFF_APPOINTMENTS: 30_000,
  STAFF_TOP_SERVICES: 30_000,
  SERVICES: 60_000,
  STAFF: 60_000,
  ROLES: 60_000,
  CATEGORIES: 60_000,
} as const;
