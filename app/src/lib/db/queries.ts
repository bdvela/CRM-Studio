import { supabase } from '@/lib/supabase/client';

type CacheEntry = { value: any; expiresAt: number; staleAt: number };
const queryCache = new Map<string, CacheEntry>();
const pendingQueries = new Map<string, Promise<any>>();
const lastErrors = new Map<string, string | null>();
let refreshQueue = new Map<string, Promise<any>>();

function cacheKey(name: string, params?: unknown) {
  return params === undefined ? name : `${name}:${JSON.stringify(params)}`;
}

export function getLastError(name: string): string | null {
  return lastErrors.get(name) || null;
}

export function clearError(name: string) {
  lastErrors.delete(name);
}

function clearQueryCache(prefix?: string) {
  if (!prefix) {
    queryCache.clear();
    pendingQueries.clear();
    return;
  }

  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) queryCache.delete(key);
  }
  for (const key of pendingQueries.keys()) {
    if (key.startsWith(prefix)) pendingQueries.delete(key);
  }
}

let staleCallbacks = new Map<string, Set<() => void>>();

async function cachedQuery<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = queryCache.get(key);
  
  // Fresh hit: return immediately
  if (hit && hit.expiresAt > now) return hit.value as T;
  
  // Stale hit but within stale window (2x TTL): return stale + refresh in background
  if (hit && hit.staleAt > now) {
    refreshInBackground(key, ttlMs, fetcher);
    return hit.value as T;
  }

  const pending = pendingQueries.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((value) => {
      queryCache.set(key, { value, expiresAt: Date.now() + ttlMs, staleAt: Date.now() + ttlMs * 3 });
      pendingQueries.delete(key);
      lastErrors.delete(key);
      return value;
    })
    .catch((error) => {
      pendingQueries.delete(key);
      lastErrors.set(key, error?.message || error?.toString() || 'Error desconocido');
      throw error;
    });

  pendingQueries.set(key, promise);
  return promise;
}

function refreshInBackground(key: string, ttlMs: number, fetcher: () => Promise<any>) {
  if (refreshQueue.has(key)) return;
  const promise = fetcher()
    .then((value) => {
      queryCache.set(key, { value, expiresAt: Date.now() + ttlMs, staleAt: Date.now() + ttlMs * 3 });
      refreshQueue.delete(key);
      lastErrors.delete(key);
      const cbs = staleCallbacks.get(key);
      if (cbs) { cbs.forEach(cb => cb()); staleCallbacks.delete(key); }
      return value;
    })
    .catch(() => { refreshQueue.delete(key); });
  refreshQueue.set(key, promise);
}

export function onCacheRefresh(key: string, cb: () => void) {
  if (!staleCallbacks.has(key)) staleCallbacks.set(key, new Set());
  staleCallbacks.get(key)!.add(cb);
}

export function removeCacheRefresh(key: string, cb: () => void) {
  staleCallbacks.get(key)?.delete(cb);
}

function getUpcomingBirthdays(staff: any[], limit = 3, windowDays = 45) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const items: Array<{ id: string; name: string; birthday_date: string; next_birthday: string; days_left: number; is_today: boolean }> = [];
  
  for (const member of staff) {
    if (!member.birthday_date) continue;
    const birthday = new Date(member.birthday_date);
    const next = new Date(start.getFullYear(), birthday.getMonth(), birthday.getDate());
    if (next < start) next.setFullYear(next.getFullYear() + 1);
    const daysLeft = Math.ceil((next.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= windowDays) {
      items.push({
        id: member.id,
        name: member.name,
        birthday_date: member.birthday_date,
        next_birthday: next.toISOString(),
        days_left: daysLeft,
        is_today: daysLeft === 0,
      });
    }
  }
  
  items.sort((a, b) => a.days_left - b.days_left);
  return items.slice(0, limit);
}

export async function getClients() {
  return cachedQuery(cacheKey('clients'), 15_000, async () => {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    const { data: stats } = await supabase.from('client_stats').select('*');
    if (stats) {
      const statsMap = new Map(stats.map((s: any) => [s.id, s]));
      data?.forEach((c: any) => { c.client_stats = statsMap.get(c.id); });
    }
    return data;
  });
}

export async function getClientById(id: string) {
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('getClientById: invalid id', id);
    return null;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.warn('getClientById: not a valid UUID:', id);
    return null;
  }
  return cachedQuery(cacheKey('client', id), 15_000, async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      const { data: stats } = await supabase.from('client_stats').select('*').eq('id', id).maybeSingle();
      if (stats) (data as any).client_stats = stats;
      return data;
    } catch (e) {
      console.error('getClientById error:', (e as any).message || e);
      return null;
    }
  });
}

export async function createClient(input: any) {
  const { data, error } = await supabase.from('clients').insert(input).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function updateClient(id: string, input: any) {
  const { data, error } = await supabase.from('clients').update(input).eq('id', id).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
  clearQueryCache();
  return true;
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export async function getCategories(activeOnly = true) {
  return cachedQuery(cacheKey('categories', activeOnly), 60_000, async () => {
    try {
      let q = supabase.from('categories').select('*').order('sort_order').order('name');
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('getCategories error:', e);
      return [];
    }
  });
}

// ─── SERVICES ───────────────────────────────────────────────────────────────

export async function getServices(activeOnly = true) {
  return cachedQuery(cacheKey('services', activeOnly), 60_000, async () => {
    try {
      let q = supabase.from('services').select(`
        *,
        category:categories(*)
      `).order('category_id').order('name');
      if (activeOnly) q = q.eq('active', true);
      const { data: servicesData, error: servicesErr } = await q;
      if (servicesErr) throw servicesErr;
      
      if (!servicesData || servicesData.length === 0) return [];
      
      try {
        const serviceIds = servicesData.map((s: any) => s.id);
        const { data: staffServicesData, error: ssErr } = await supabase
          .from('staff_services')
          .select('*')
          .in('service_id', serviceIds);
        
        if (!ssErr && staffServicesData) {
          const ssMap = new Map<string, any[]>();
          for (const ss of staffServicesData) {
            const existing = ssMap.get(ss.service_id) || [];
            existing.push(ss);
            ssMap.set(ss.service_id, existing);
          }
          
          return servicesData.map((svc: any) => ({
            ...svc,
            staff_services: ssMap.get(svc.id) || []
          }));
        }
      } catch (ssE) {
        console.log('staff_services table may not exist yet, skipping:', ssE);
      }
      
      return servicesData.map((svc: any) => ({
        ...svc,
        staff_services: []
      }));
    } catch (e) {
      console.error('getServices error:', e);
      return [];
    }
  });
}

export async function createService(input: any) {
  const { data, error } = await supabase.from('services').insert(input).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function updateService(id: string, input: any) {
  const { data, error } = await supabase.from('services').update(input).eq('id', id).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function deleteService(id: string) {
  try {
    await supabase.from('staff_services').delete().eq('service_id', id);
  } catch (e) {
    console.log('staff_services table may not exist, skipping:', e);
  }
  await supabase.from('appointment_services').delete().eq('service_id', id);
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  clearQueryCache();
  return true;
}

export async function updateStaffServices(serviceId: string, staffIds: string[]) {
  try {
    await supabase.from('staff_services').delete().eq('service_id', serviceId);
    if (staffIds.length > 0) {
      const rows = staffIds.map(sid => ({ service_id: serviceId, staff_id: sid }));
      await supabase.from('staff_services').insert(rows);
    }
    return true;
  } catch (e) {
    console.log('updateStaffServices (table may not exist yet):', e);
    if (staffIds.length > 0) {
      throw new Error('La tabla staff_services no existe. Ejecuta la migración primero.');
    }
    return true;
  }
}

export async function getStaffForService(serviceId: string, categoryId?: string, activeOnly = true) {
  try {
    let hasExplicitAssignments = false;
    let assignedStaffIds: string[] = [];
    
    try {
      const { data: explicitAssignments, error: ssErr } = await supabase
        .from('staff_services')
        .select('staff_id')
        .eq('service_id', serviceId);
      
      if (!ssErr && explicitAssignments && explicitAssignments.length > 0) {
        hasExplicitAssignments = true;
        assignedStaffIds = explicitAssignments.map(s => s.staff_id);
      }
    } catch (ssE) {
      console.log('staff_services table may not exist, falling back to categories:', ssE);
    }
    
    if (hasExplicitAssignments && assignedStaffIds.length > 0) {
      let q = supabase.from('staff').select(`
        *,
        role:roles(name, color),
        staff_specialties(*, category:categories(*))
      `).order('name').in('id', assignedStaffIds);
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    
    if (categoryId) {
      const { data: specialtyStaffIds, error: spErr } = await supabase
        .from('staff_specialties')
        .select('staff_id')
        .eq('category_id', categoryId);
      
      if (spErr) throw spErr;
      
      if (specialtyStaffIds && specialtyStaffIds.length > 0) {
        const staffIds = specialtyStaffIds.map(s => s.staff_id);
        let q = supabase.from('staff').select(`
          *,
          role:roles(name, color),
          staff_specialties(*, category:categories(*))
        `).order('name').in('id', staffIds);
        if (activeOnly) q = q.eq('active', true);
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      }
    }
    
    let q = supabase.from('staff').select(`
      *,
      role:roles(name, color),
      staff_specialties(*, category:categories(*))
    `).order('name');
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getStaffForService error:', e);
    return [];
  }
}

export async function getStaff(activeOnly = true) {
  return cachedQuery(cacheKey('staff', activeOnly), 60_000, async () => {
    try {
      let q = supabase.from('staff').select(`
        *,
        role:roles(name, color),
        staff_specialties(
          *,
          category:categories(*)
        )
      `).order('name');
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      const { data: stats } = await supabase.from('staff_stats').select('*');
      if (stats) {
        const statsMap = new Map(stats.map((s: any) => [s.id, s]));
        data?.forEach((s: any) => { s.staff_stats = statsMap.get(s.id); });
      }
      return data;
    } catch (e) {
      console.error('getStaff error:', e);
      return [];
    }
  });
}

export async function getStaffById(id: string) {
  if (!id || id === 'undefined' || id === 'null') return null;
  return cachedQuery(cacheKey('staffById', id), 15_000, async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          role:roles(name, color),
          staff_specialties(*, category:categories(*))
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: stats } = await supabase.from('staff_stats').select('*').eq('id', id).maybeSingle();
      if (stats) (data as any).staff_stats = stats;
      return data;
    } catch (e) {
      console.error('getStaffById error:', e);
      return null;
    }
  });
}

export async function updateStaffSpecialties(staffId: string, categoryIds: string[]) {
  try {
    await supabase.from('staff_specialties').delete().eq('staff_id', staffId);
    if (categoryIds.length > 0) {
      const rows = categoryIds.map(cid => ({ staff_id: staffId, category_id: cid }));
      await supabase.from('staff_specialties').insert(rows);
    }
    clearQueryCache();
    return true;
  } catch (e) {
    console.error('updateStaffSpecialties error:', e);
    throw e;
  }
}

export async function createStaff(input: any) {
  const { data, error } = await supabase.from('staff').insert(input).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function updateStaff(id: string, input: any) {
  const { data, error } = await supabase.from('staff').update(input).eq('id', id).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function deleteStaff(id: string) {
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
  clearQueryCache();
  return true;
}

// ─── ROLES ──────────────────────────────────────────────────────────────────

export async function getRoles(activeOnly = true) {
  return cachedQuery(cacheKey('roles', activeOnly), 60_000, async () => {
    try {
      let q = supabase.from('roles').select('*').order('name');
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('getRoles error:', e);
      return [];
    }
  });
}

export async function getAppointments(filters?: any) {
  return cachedQuery(cacheKey('appointments', filters || {}), 30_000, async () => {
    try {
      
      let q = supabase.from('appointments').select(`
        *,
        client:clients(name, phone, instagram),
        artist:staff(name, photo_url, role:roles(name, color))
      `).order('start_time', { ascending: true });
      if (filters?.dateFrom) q = q.gte('start_time', filters.dateFrom);
      if (filters?.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        q = q.lte('start_time', endOfDay.toISOString());
      }
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.artistId) q = q.eq('artist_id', filters.artistId);
      if (filters?.clientId) q = q.eq('client_id', filters.clientId);
      const { data, error } = await q;
      if (error) throw error;

      let filtered = data || [];
      if (filters?.clientSearch) {
        const search = filters.clientSearch.toLowerCase();
        filtered = filtered.filter(a =>
          a.client?.name?.toLowerCase().includes(search)
        );
      }

        if (filtered && filtered.length > 0) {
          const apptIds = filtered.map(a => a.id);

          const [svcResult, commData, balanceData] = await Promise.all([
            supabase
              .from('appointment_services')
              .select('id, appointment_id, service_id, artist_id, service_price, service:services(name, price, duration_min, category_id, category:categories(*)), artist:staff(name, photo_url)')
              .in('appointment_id', apptIds),
            supabase
              .from('commission_details')
              .select('*')
              .in('appointment_id', apptIds),
            supabase
              .from('appointment_balance')
              .select('*')
              .in('id', apptIds),
          ]);

          let svcData: any[] | null = null;
          if (!svcResult.error && svcResult.data) {
            svcData = svcResult.data;
          } else if (svcResult.error) {
            console.error('Error loading appointment services:', svcResult.error);
          }

          let commissionMap = new Map<string, any[]>();
          if (commData.data) {
            for (const cd of commData.data) {
              const existing = commissionMap.get(cd.appointment_id) || [];
              existing.push(cd);
              commissionMap.set(cd.appointment_id, existing);
            }
          }

          let balanceMap = new Map<string, any>();
          if (balanceData.data) {
            for (const b of balanceData.data) {
              balanceMap.set(b.id, b);
            }
          }
          
          if (svcData) {
            filtered.forEach((appt: any) => {
              const apptServices = svcData
                .filter(s => s.appointment_id === appt.id);
              
              appt.appointment_services = apptServices.map(s => {
                const svc: any = { 
                  id: s.id,
                  service_id: s.service_id, 
                  artist_id: s.artist_id || null,
                  service_price: s.service_price,
                  service: s.service 
                };
                if (s.artist) svc.artist = s.artist;
                
                const comms = commissionMap.get(appt.id) || [];
                const cd = comms.find((c: any) => c.appointment_service_id === s.id);
                if (cd) svc.commission_detail = cd;
                
                return svc;
              });
              
              const balance = balanceMap.get(appt.id);
              if (balance) {
                appt.appointment_balance = balance;
              }
            });
          }
        }
       return filtered;
     } catch (e) {
       console.error('getAppointments error:', e);
       return [];
     }
  });
}

export async function createAppointment(input: any) {
  const { serviceIds, services, ...apptData } = input;
  const { data, error } = await supabase.from('appointments').insert(apptData).select().single();
  if (error) throw error;
  
    const serviceInputs = services || (serviceIds ? serviceIds.map((sid: string) => ({ service_id: sid })) : []);
    if (serviceInputs && serviceInputs.length > 0) {
      const svcRows = serviceInputs.map((si: any) => ({
        appointment_id: data.id,
        service_id: si.service_id,
        artist_id: si.artist_id || null,
        service_price: si.service_price ?? null,
      }));
      const { error: svcErr } = await supabase.from('appointment_services').insert(svcRows);
      if (svcErr) throw svcErr;
  }
  clearQueryCache();
  return data;
}

export async function updateAppointment(id: string, input: any) {
  const { serviceIds, services, ...rest } = input;
  const { data, error } = await supabase.from('appointments').update(rest).eq('id', id).select().single();
  if (error) throw error;
  
    const hasServices = services !== undefined || serviceIds !== undefined;
    if (hasServices) {
      await supabase.from('appointment_services').delete().eq('appointment_id', id);
      const serviceInputs = services || (serviceIds ? serviceIds.map((sid: string) => ({ service_id: sid })) : []);
      if (serviceInputs.length > 0) {
        const svcRows = serviceInputs.map((si: any) => ({
          appointment_id: id,
          service_id: si.service_id,
          artist_id: si.artist_id || null,
          service_price: si.service_price ?? null,
        }));
        const { error: svcErr } = await supabase.from('appointment_services').insert(svcRows);
        if (svcErr) throw svcErr;
      }
    }

  clearQueryCache();
  return data;
}

export async function checkOverlap(artistId: string, startTime: string, endTime: string, _excludeId?: string) {
  let q = supabase.from('appointments').select('id, title, start_time, end_time').eq('artist_id', artistId).in('status', ['programada', 'en_curso']).lt('start_time', endTime).gt('end_time', startTime);
  if (_excludeId) q = q.neq('id', _excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getPayments(filters?: any) {
  return cachedQuery(cacheKey('payments', filters || {}), 10_000, async () => {
    try {
      
      let q = supabase.from('payments').select('*').order('date', { ascending: false });
      if (filters?.dateFrom) q = q.gte('date', filters.dateFrom);
      if (filters?.dateTo) q = q.lte('date', filters.dateTo);
      if (filters?.type) q = q.eq('type', filters.type);
      if (filters?.category) q = q.eq('category', filters.category);
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.flatMap(p => p.client_id ? [p.client_id] : []))];
        const apptIds = [...new Set(data.flatMap(p => p.appointment_id ? [p.appointment_id] : []))];
        const [clients, appts] = await Promise.all([
          clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
          apptIds.length > 0 ? supabase.from('appointments').select('id, title').in('id', apptIds) : { data: [] },
        ]);
        const clientMap = new Map(clients.data?.map((c: any) => [c.id, c.name]) || []);
        const apptMap = new Map(appts.data?.map((a: any) => [a.id, a.title]) || []);
        data.forEach(p => {
          p.client = p.client_id ? { name: clientMap.get(p.client_id) } : null;
          p.appointment = p.appointment_id ? { title: apptMap.get(p.appointment_id) } : null;
        });
      }
      return data;
    } catch (e) {
      console.error('getPayments error:', e);
      return [];
    }
  });
}

export async function createPayment(input: any) {
  const { data, error } = await supabase.from('payments').insert(input).select().single();
  if (error) throw error;
  clearQueryCache();
  return data;
}

export async function getDashboardMetrics() {
  return cachedQuery(cacheKey('dashboard'), 30_000, async () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Week ranges for trend comparison
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const twoWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).toISOString();

    const [todayAppts, monthIncome, monthExpenses, weekIncome, lastWeekIncome, weekExpensesR, lastWeekExpensesR, activeClients, toReactivates, completedAppts, staffData] = await Promise.all([
      supabase.from('appointments').select(`
        *,
        client:clients(name),
        artist:staff(name, role:roles(name))
      `).gte('start_time', todayStart).lt('start_time', todayEnd).order('start_time'),
      supabase.from('payments').select('amount, date').eq('type', 'ingreso').gte('date', firstOfMonth).lte('date', endOfMonth),
      supabase.from('payments').select('amount').eq('type', 'egreso').gte('date', firstOfMonth).lte('date', endOfMonth),
      supabase.from('payments').select('amount').eq('type', 'ingreso').gte('date', weekAgo).lte('date', now.toISOString()),
      supabase.from('payments').select('amount').eq('type', 'ingreso').gte('date', twoWeeksAgo).lte('date', weekAgo),
      supabase.from('payments').select('amount').eq('type', 'egreso').gte('date', weekAgo).lte('date', now.toISOString()),
      supabase.from('payments').select('amount').eq('type', 'egreso').gte('date', twoWeeksAgo).lte('date', weekAgo),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'activa'),
      supabase.from('clients').select('id, name, phone, instagram, email').eq('status', 'inactiva'),
      supabase.from('appointments').select('id, title, total_price, client_id').eq('status', 'completada'),
      supabase.from('staff').select('id, name, birthday_date'),
    ]);

    if (todayAppts.error) throw todayAppts.error;
    if (monthIncome.error) throw monthIncome.error;

    // Pending payments calculation
    const pendingPayments: any[] = [];
    if (completedAppts.data) {
      const clientIds = [...new Set(completedAppts.data.flatMap((a: any) => a.client_id ? [a.client_id] : []))];
      if (clientIds.length > 0) {
        const [clients, incomePayments] = await Promise.all([
          supabase.from('clients').select('id, name').in('id', clientIds),
          supabase.from('payments').select('appointment_id, amount').eq('type', 'ingreso').in('appointment_id', completedAppts.data.map((appt: any) => appt.id)),
        ]);
        const clientMap = new Map(clients.data?.map((c: any) => [c.id, c.name]) || []);
        const paymentMap = new Map<string, number>();
        for (const payment of incomePayments.data || []) {
          paymentMap.set(payment.appointment_id, (paymentMap.get(payment.appointment_id) || 0) + Number(payment.amount || 0));
        }
        completedAppts.data.forEach((appt: any) => {
          const totalPaid = paymentMap.get(appt.id) || 0;
          if (totalPaid < Number(appt.total_price)) {
            pendingPayments.push({ ...appt, client: { name: clientMap.get(appt.client_id) || 'Sin clienta' } });
          }
        });
      }
    }

    const totalIncome = monthIncome.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const totalExpenses = monthExpenses.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const wIncome = (weekIncome.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const lwIncome = (lastWeekIncome.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const wExpenses = (weekExpensesR.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const lwExpenses = (lastWeekExpensesR.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // Week trend (last 7 days)
    const weekTrend = getWeekTrend(monthIncome.data || []);

    // Staff occupancy today
    const staffOccupancy = getStaffTodayOccupancy(todayAppts.data || [], staffData.data || []);

    // Recent activity
    const recentActivity = await getRecentActivity();
    
    return {
      todayAppointments: todayAppts.data || [],
      monthIncome: totalIncome,
      monthExpenses: totalExpenses,
      netProfit: totalIncome - totalExpenses,
      activeClients: activeClients.count || 0,
      weekIncome: wIncome,
      lastWeekIncome: lwIncome,
      weekExpenses: wExpenses,
      lastWeekExpenses: lwExpenses,
      weekTrend,
      pendingPayments,
      toReactivates: toReactivates.data || [],
      upcomingBirthdays: getUpcomingBirthdays(staffData.data || []),
      staffOccupancy,
      recentActivity,
      totalAppointmentsToday: todayAppts.data?.length || 0,
    };
  });
}

function getWeekTrend(payments: any[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = 0;
  }
  for (const p of payments) {
    if (!p.date) continue;
    const dayKey = p.date.split('T')[0] || p.date.substring(0, 10);
    if (dayKey in days) {
      days[dayKey] += Number(p.amount) || 0;
    }
  }
  return Object.entries(days).map(([date, amount]) => ({ date, amount }));
}

function getStaffTodayOccupancy(appointments: any[], staff: any[]) {
  const STAFF_CAPACITY_MIN = 8 * 60;
  const countMap = new Map<string, { count: number; totalMin: number }>();
  
  for (const appt of appointments) {
    if (!appt.artist_id) continue;
    const existing = countMap.get(appt.artist_id) || { count: 0, totalMin: 0 };
    existing.count += 1;
    existing.totalMin += Number(appt.total_duration_min || 60);
    countMap.set(appt.artist_id, existing);
  }

  return staff.map(member => {
    const data = countMap.get(member.id) || { count: 0, totalMin: 0 };
    const pct = Math.min(100, Math.round((data.totalMin / STAFF_CAPACITY_MIN) * 100));
    return {
      id: member.id,
      name: member.name,
      appointmentCount: data.count,
      totalDurationMin: data.totalMin,
      capacityPercent: pct,
      color: '',
    };
  }).filter(s => s.appointmentCount > 0).sort((a, b) => b.capacityPercent - a.capacityPercent);
}

async function getRecentActivity() {
  try {
    const [recentAppts, recentPayments] = await Promise.all([
      supabase.from('appointments').select(`
        id, title, status, created_at, start_time,
        client:clients(name)
      `).order('created_at', { ascending: false }).limit(3),
      supabase.from('payments').select(`
        id, amount, type, date, created_at,
        client:clients(name)
      `).order('created_at', { ascending: false }).limit(2),
    ]);

    const activities: any[] = [];

    for (const appt of recentAppts.data || []) {
      const raw = appt as any;
      if (raw.status === 'completada') {
        activities.push({
          id: `appt-completed-${raw.id}`,
          type: 'cita_completada',
          description: `${raw.client?.name || 'Clienta'} completó ${raw.title || 'su cita'}`,
          timestamp: raw.start_time || raw.created_at,
          href: '/citas',
        });
      } else {
        activities.push({
          id: `appt-${raw.id}`,
          type: 'cita_creada',
          description: `Cita agendada: ${raw.client?.name || 'Clienta'} - ${raw.title || 'Sin título'}`,
          timestamp: raw.created_at,
          href: '/citas',
        });
      }
    }

    for (const payment of recentPayments.data || []) {
      const raw = payment as any;
      activities.push({
        id: `payment-${raw.id}`,
        type: 'pago_registrado',
        description: `Pago de ${raw.type === 'egreso' ? 'gasto' : 'ingreso'}: ${raw.client?.name || 'Sin cliente'} - S/${Number(raw.amount).toFixed(2)}`,
        timestamp: raw.created_at || raw.date,
        href: '/pagos',
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 4);
  } catch (e) {
    console.error('getRecentActivity error:', e);
    return [];
  }
}

// ─── COMMISSION OVERRIDES ───────────────────────────────────────────────────

export async function getCommissionOverrides(staffId: string) {
  try {
    const { data, error } = await supabase
      .from('staff_commission_overrides')
      .select('*, service:services(name, price)')
      .eq('staff_id', staffId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getCommissionOverrides error:', e);
    return [];
  }
}

export async function upsertCommissionOverride(input: {
  staff_id: string;
  service_id: string;
  founder_fixed_amount: number;
}) {
  try {
    const { data, error } = await supabase
      .from('staff_commission_overrides')
      .upsert(input, { onConflict: 'staff_id, service_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('upsertCommissionOverride error:', e);
    throw e;
  }
}

export async function deleteCommissionOverride(staffId: string, serviceId: string) {
  try {
    const { error } = await supabase
      .from('staff_commission_overrides')
      .delete()
      .eq('staff_id', staffId)
      .eq('service_id', serviceId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('deleteCommissionOverride error:', e);
    throw e;
  }
}

// ─── COMMISSION REPORT ──────────────────────────────────────────────────────

export async function getCommissionReport(dateFrom: string, dateTo: string) {
  return cachedQuery(cacheKey('commissionReport', { dateFrom, dateTo }), 15_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);
      
      const { data: apptIdsData, error: apptErr } = await supabase
        .from('appointments')
        .select('id')
        .gte('start_time', dateFrom)
        .lte('start_time', endOfTo.toISOString())
        .eq('status', 'completada');
      
      if (apptErr) throw apptErr;
      if (!apptIdsData || apptIdsData.length === 0) return [];
      
      const apptIds = apptIdsData.map(a => a.id);
      
      const { data: details, error: detErr } = await supabase
        .from('commission_details')
        .select('*')
        .in('appointment_id', apptIds);
      
      if (detErr) throw detErr;
      if (!details) return [];

      const staffIds = [...new Set(details.flatMap(d => d.artist_id ? [d.artist_id] : []))];
      const { data: staffRoles } = await supabase
        .from('staff')
        .select('id, role:roles(name)')
        .in('id', staffIds);
      
      const roleMap = new Map(staffRoles?.map(s => [s.id, (s.role as any)?.name]));
      
      const map = new Map<string, {
        artist_id: string | null;
        artist_name: string | null;
        artist_role_name: string | null;
        total_services: number;
        total_service_revenue: number;
        total_artist_commission: number;
        total_founder_share: number;
      }>();
      
      for (const d of details) {
        const key = d.artist_id || 'NO_ARTIST';
        const existing = map.get(key) || {
          artist_id: d.artist_id,
          artist_name: d.artist_name || (d.artist_id ? null : 'Sin artista'),
          artist_role_name: d.artist_id ? roleMap.get(d.artist_id) || null : null,
          total_services: 0,
          total_service_revenue: 0,
          total_artist_commission: 0,
          total_founder_share: 0,
        };
        existing.total_services += 1;
        existing.total_service_revenue += Number(d.service_price) || 0;
        existing.total_artist_commission += Number(d.artist_commission) || 0;
        existing.total_founder_share += Number(d.founder_share) || 0;
        map.set(key, existing);
      }
      
      return Array.from(map.values());
    } catch (e) {
      console.error('getCommissionReport error:', e);
      return [];
    }
  });
}

// ─── HU-20: PENDING PAYMENTS ───────────────────────────────────────────────

export async function getPendingPayments() {
  return cachedQuery(cacheKey('pendingPayments'), 10_000, async () => {
    try {
      const { data: appts, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(name, phone),
          artist:staff(name)
        `)
        .eq('status', 'completada')
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (!appts || appts.length === 0) return [];

      const apptIds = appts.map(a => a.id);

      const [balanceResult, svcResult] = await Promise.all([
        supabase.from('appointment_balance').select('*').in('id', apptIds),
        supabase.from('appointment_services').select(`
          appointment_id,
          service:services(name, price),
          artist:staff(name)
        `).in('appointment_id', apptIds),
      ]);

      const balanceMap = new Map<string, any>();
      if (balanceResult.data) {
        for (const b of balanceResult.data) {
          balanceMap.set(b.id, b);
        }
      }

      const svcMap = new Map<string, any[]>();
      if (svcResult.data) {
        for (const s of svcResult.data) {
          const sid = (s as any).appointment_id;
          const existing = svcMap.get(sid) || [];
          existing.push(s);
          svcMap.set(sid, existing);
        }
      }

      const pending = appts.filter((a: any) => {
        const bal = balanceMap.get(a.id);
        return bal && Number(bal.pending_balance) > 0;
      });

      return pending.map((a: any) => ({
        ...a,
        appointment_balance: balanceMap.get(a.id) || null,
        appointment_services: svcMap.get(a.id) || [],
      }));
    } catch (e) {
      console.error('getPendingPayments error:', e);
      return [];
    }
  });
}

// ─── HU-15: STAFF PERFORMANCE ──────────────────────────────────────────────

export async function getStaffPerformance(staffId: string, dateFrom: string, dateTo: string) {
  const key = cacheKey('staffPerformance', { staffId, dateFrom, dateTo });
  return cachedQuery(key, 15_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const [appointmentsResult, commissionResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, total_price, start_time', { count: 'exact' })
          .eq('artist_id', staffId)
          .eq('status', 'completada')
          .gte('start_time', dateFrom)
          .lte('start_time', endOfTo.toISOString()),
        supabase
          .from('commission_details')
          .select('*')
          .eq('artist_id', staffId),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;

      const appts = appointmentsResult.data || [];
      const totalAppointments = appts.length;
      const totalRevenue = appts.reduce((sum, a) => sum + Number(a.total_price || 0), 0);

      let totalCommission = 0;
      let totalFounderShare = 0;
      if (commissionResult.data) {
        for (const d of commissionResult.data) {
          totalCommission += Number(d.artist_commission) || 0;
          totalFounderShare += Number(d.founder_share) || 0;
        }
      }

      const lastAppt = appts.length > 0
        ? appts.reduce((latest, a) => a.start_time > latest.start_time ? a : latest, appts[0])
        : null;

      return {
        totalAppointments,
        totalRevenue,
        totalCommission,
        totalFounderShare,
        lastAppointmentDate: lastAppt?.start_time || null,
        lastAppointmentTitle: lastAppt ? `Cita #${lastAppt.id.slice(0, 8)}` : null,
      };
    } catch (e) {
      console.error('getStaffPerformance error:', e);
      return null;
    }
  });
}

export async function getStaffTopServices(staffId: string, dateFrom: string, dateTo: string) {
  const key = cacheKey('staffTopServices', { staffId, dateFrom, dateTo });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data: apptIds, error: apptErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('artist_id', staffId)
        .eq('status', 'completada')
        .gte('start_time', dateFrom)
        .lte('start_time', endOfTo.toISOString());

      if (apptErr) throw apptErr;
      if (!apptIds || apptIds.length === 0) return [];

      const { data: svcData, error: svcErr } = await supabase
        .from('appointment_services')
        .select(`
          service_id,
          service_price,
          service:services(name, price)
        `)
        .in('appointment_id', apptIds.map(a => a.id))
        .eq('artist_id', staffId);

      if (svcErr) throw svcErr;
      if (!svcData) return [];

      const countMap = new Map<string, { name: string; count: number; revenue: number }>();
      for (const s of svcData) {
        const svc = s as any;
        const existing = countMap.get(svc.service_id) || { name: svc.service?.name || 'Desconocido', count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(svc.service_price || 0);
        countMap.set(svc.service_id, existing);
      }

      return Array.from(countMap.entries())
        .map(([serviceId, data]) => ({ service_id: serviceId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (e) {
      console.error('getStaffTopServices error:', e);
      return [];
    }
  });
}

export async function getStaffAppointments(staffId: string, dateFrom: string, dateTo: string, limit = 20) {
  const key = cacheKey('staffAppointments', { staffId, dateFrom, dateTo, limit });
  return cachedQuery(key, 15_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(name, phone)
        `)
        .eq('artist_id', staffId)
        .order('start_time', { ascending: false })
        .gte('start_time', dateFrom)
        .lte('start_time', endOfTo.toISOString())
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const apptIds = data.map(a => a.id);

      const [balanceResult, svcResult] = await Promise.all([
        supabase.from('appointment_balance').select('*').in('id', apptIds),
        supabase.from('appointment_services').select(`
          appointment_id,
          service_price,
          service:services(name, price, duration_min)
        `).in('appointment_id', apptIds).eq('artist_id', staffId),
      ]);

      const balanceMap = new Map<string, any>();
      if (balanceResult.data) {
        for (const b of balanceResult.data) balanceMap.set(b.id, b);
      }

      const svcMap = new Map<string, any[]>();
      if (svcResult.data) {
        for (const s of svcResult.data) {
          const sid = (s as any).appointment_id;
          const existing = svcMap.get(sid) || [];
          existing.push(s);
          svcMap.set(sid, existing);
        }
      }

      return data.map((a: any) => ({
        ...a,
        appointment_balance: balanceMap.get(a.id) || null,
        appointment_services: svcMap.get(a.id) || [],
      }));
    } catch (e) {
      console.error('getStaffAppointments error:', e);
      return [];
    }
  });
}

// ─── HU-19: FINANCIAL SUMMARY ──────────────────────────────────────────────

export async function getFinancialSummary(dateFrom: string, dateTo: string) {
  const key = cacheKey('financialSummary', { dateFrom, dateTo });
  return cachedQuery(key, 15_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', endOfTo.toISOString().split('T')[0]);

      if (error) throw error;
      if (!data) return { totalIncome: 0, totalExpenses: 0, netProfit: 0, count: 0 };

      const totalIncome = data
        .filter(p => p.type === 'ingreso')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = data
        .filter(p => p.type === 'egreso')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        count: data.length,
      };
    } catch (e) {
      console.error('getFinancialSummary error:', e);
      return { totalIncome: 0, totalExpenses: 0, netProfit: 0, count: 0 };
    }
  });
}

export async function getIncomeByMethod(dateFrom: string, dateTo: string) {
  const key = cacheKey('incomeByMethod', { dateFrom, dateTo });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('type', 'ingreso')
        .gte('date', dateFrom)
        .lte('date', endOfTo.toISOString().split('T')[0]);

      if (error) throw error;
      if (!data) return [];

      const map = new Map<string, number>();
      for (const p of data) {
        const method = p.payment_method || 'otro';
        map.set(method, (map.get(method) || 0) + Number(p.amount));
      }

      return Array.from(map.entries())
        .map(([method, total]) => ({ method, total }))
        .sort((a, b) => b.total - a.total);
    } catch (e) {
      console.error('getIncomeByMethod error:', e);
      return [];
    }
  });
}

export async function getExpensesByCategory(dateFrom: string, dateTo: string) {
  const key = cacheKey('expensesByCategory', { dateFrom, dateTo });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('payments')
        .select('category, amount')
        .eq('type', 'egreso')
        .gte('date', dateFrom)
        .lte('date', endOfTo.toISOString().split('T')[0]);

      if (error) throw error;
      if (!data) return [];

      const map = new Map<string, number>();
      for (const p of data) {
        map.set(p.category, (map.get(p.category) || 0) + Number(p.amount));
      }

      return Array.from(map.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    } catch (e) {
      console.error('getExpensesByCategory error:', e);
      return [];
    }
  });
}

// ─── HU-22: MONTHLY REPORT ─────────────────────────────────────────────────

export async function getMonthlyReport(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
  const key = cacheKey('monthlyReport', { year, month });

  return cachedQuery(key, 30_000, async () => {
    try {
      const [apptsResult, paymentsResult, clientsResult, topSvcResult, topArtResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, total_price, status', { count: 'exact' })
          .gte('start_time', startDate)
          .lte('start_time', endDate),
        supabase
          .from('payments')
          .select('type, amount')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('clients')
          .select('id, name, phone, status, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        getTopServices(startDate, endDate),
        getTopArtistsByRevenue(startDate, endDate),
      ]);

      if (apptsResult.error) throw apptsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const completedAppts = (apptsResult.data || []).filter(a => a.status === 'completada');
      const totalIncome = (paymentsResult.data || [])
        .filter(p => p.type === 'ingreso')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = (paymentsResult.data || [])
        .filter(p => p.type === 'egreso')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const inactiveData = await getInactiveClients(60);

      return {
        completedAppointments: completedAppts.length,
        totalAppointments: apptsResult.data?.length || 0,
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        newClients: clientsResult.data || [],
        topServices: topSvcResult,
        topArtists: topArtResult,
        inactiveClients: inactiveData,
      };
    } catch (e) {
      console.error('getMonthlyReport error:', e);
      return null;
    }
  });
}

export async function getTopServices(dateFrom: string, dateTo: string, limit = 5) {
  const key = cacheKey('topServices', { dateFrom, dateTo, limit });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data: apptIds } = await supabase
        .from('appointments')
        .select('id')
        .eq('status', 'completada')
        .gte('start_time', dateFrom)
        .lte('start_time', endOfTo.toISOString());

      if (!apptIds || apptIds.length === 0) return [];

      const { data: svcData } = await supabase
        .from('appointment_services')
        .select(`
          service_id,
          service_price,
          service:services(name, price)
        `)
        .in('appointment_id', apptIds.map(a => a.id));

      if (!svcData) return [];

      const map = new Map<string, { name: string; count: number; revenue: number }>();
      for (const s of svcData) {
        const svc = s as any;
        const existing = map.get(svc.service_id) || { name: svc.service?.name || 'Desconocido', count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(svc.service_price || 0);
        map.set(svc.service_id, existing);
      }

      return Array.from(map.entries())
        .map(([serviceId, data]) => ({ service_id: serviceId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (e) {
      console.error('getTopServices error:', e);
      return [];
    }
  });
}

export async function getTopArtistsByRevenue(dateFrom: string, dateTo: string, limit = 5) {
  const key = cacheKey('topArtistsByRevenue', { dateFrom, dateTo, limit });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data: apptIds } = await supabase
        .from('appointments')
        .select('id, artist_id')
        .eq('status', 'completada')
        .gte('start_time', dateFrom)
        .lte('start_time', endOfTo.toISOString());

      if (!apptIds || apptIds.length === 0) return [];

      const { data: svcData } = await supabase
        .from('commission_details')
        .select('artist_id, artist_name, service_price, artist_commission')
        .in('appointment_id', apptIds.map(a => a.id));

      if (!svcData) return [];

      const map = new Map<string, { artist_name: string; totalRevenue: number; totalServices: number; totalCommission: number }>();
      for (const d of svcData) {
        if (!d.artist_id) continue;
        const existing = map.get(d.artist_id) || {
          artist_name: d.artist_name || 'Desconocido',
          totalRevenue: 0,
          totalServices: 0,
          totalCommission: 0,
        };
        existing.totalRevenue += Number(d.service_price) || 0;
        existing.totalServices += 1;
        existing.totalCommission += Number(d.artist_commission) || 0;
        map.set(d.artist_id, existing);
      }

      return Array.from(map.entries())
        .map(([artist_id, data]) => ({ artist_id, ...data }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    } catch (e) {
      console.error('getTopArtistsByRevenue error:', e);
      return [];
    }
  });
}

export async function getNewClients(dateFrom: string, dateTo: string) {
  const key = cacheKey('newClients', { dateFrom, dateTo });
  return cachedQuery(key, 30_000, async () => {
    try {
      const endOfTo = new Date(dateTo);
      endOfTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, instagram, created_at')
        .gte('created_at', dateFrom)
        .lte('created_at', endOfTo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('getNewClients error:', e);
      return [];
    }
  });
}

export async function getInactiveClients(daysThreshold = 60) {
  const key = cacheKey('inactiveClients', daysThreshold);
  return cachedQuery(key, 30_000, async () => {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, instagram, email, status')
        .eq('status', 'activa');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const clientIds = data.map(c => c.id);
      const { data: stats } = await supabase
        .from('client_stats')
        .select('*')
        .in('id', clientIds);

      const statsMap = new Map(stats?.map((s: any) => [s.id, s]) || []);

      return data
        .filter((c: any) => {
          const clientStat = statsMap.get(c.id);
          const lastVisit = clientStat?.last_visit;
          if (!lastVisit) return true;
          return new Date(lastVisit) < thresholdDate;
        })
        .map((c: any) => {
          const clientStat = statsMap.get(c.id);
          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            instagram: c.instagram,
            email: c.email,
            last_visit: clientStat?.last_visit || null,
          };
        })
        .slice(0, 20);
     } catch (e) {
       console.error('getInactiveClients error:', e);
       return [];
     }
   });
 }

export async function getAppointmentById(id: string) {
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('getAppointmentById: invalid id', id);
    return null;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.warn('getAppointmentById: not a valid UUID:', id);
    return null;
  }
  return cachedQuery(cacheKey('appointment', id), 10_000, async () => {
    try {
      const { data: appt, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(name, phone, instagram),
          artist:staff(name, photo_url, role:roles(name, color))
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!appt) return null;

      const [svcResult, balanceResult, commResult] = await Promise.all([
        supabase
          .from('appointment_services')
          .select('id, appointment_id, service_id, artist_id, service_price, service:services(name, price, duration_min, category_id, category:categories(*)), artist:staff(name, photo_url)')
          .eq('appointment_id', id),
        supabase
          .from('appointment_balance')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('commission_details')
          .select('*')
          .eq('appointment_id', id),
      ]);

      if (svcResult.data) {
        (appt as any).appointment_services = svcResult.data.map((s: any) => {
          const svc: any = {
            id: s.id,
            service_id: s.service_id,
            artist_id: s.artist_id || null,
            service_price: s.service_price,
            service: s.service,
          };
          if (s.artist) svc.artist = s.artist;

          if (commResult.data) {
            const cd = commResult.data.find((c: any) => c.appointment_service_id === s.id);
            if (cd) svc.commission_detail = cd;
          }
          return svc;
        });
      }

      if (balanceResult.data) {
        (appt as any).appointment_balance = balanceResult.data;
      }

      return appt;
    } catch (e) {
      console.error('getAppointmentById error:', (e as any).message || e);
      return null;
    }
  });
}
