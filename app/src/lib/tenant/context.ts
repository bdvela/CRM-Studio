'use client';

import type { BusinessBranding } from './resolve';

// Module-level singleton — safe because each browser tab is bound to one subdomain.
let _businessId: string | null = null;
let _branding: BusinessBranding | null = null;

export function setTenantContext(business: BusinessBranding | null) {
  _businessId = business?.id ?? null;
  _branding = business;
}

export function getBusinessId(): string {
  if (!_businessId) throw new Error('Tenant context not initialised. Call setTenantContext() first.');
  return _businessId;
}

export function getBusinessIdOrNull(): string | null {
  return _businessId;
}

export function getBusinessBranding(): BusinessBranding | null {
  return _branding;
}

export function formatCurrencyTenant(amount: number): string {
  const symbol = _branding?.currency_symbol ?? 'S/';
  return `${symbol} ${amount.toFixed(2)}`;
}
