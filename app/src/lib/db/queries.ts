import { mockData } from './mock-data';
import { supabase } from '@/lib/supabase/client';

const USE_MOCK = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

export async function getClients() {
  if (USE_MOCK) { await delay(); return mockData.clients; }
  try {
    
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    const { data: stats } = await supabase.from('client_stats').select('*');
    if (stats) {
      const statsMap = new Map(stats.map((s: any) => [s.id, s]));
      data?.forEach((c: any) => { c.client_stats = statsMap.get(c.id); });
    }
    return data;
  } catch (e) {
    console.error('getClients error:', e);
    return [];
  }
}

export async function getClientById(id: string) {
  if (USE_MOCK) { await delay(); return mockData.clients.find(c => c.id === id); }
  try {
    
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error) throw error;
    const { data: stats } = await supabase.from('client_stats').select('*').eq('id', id).single();
    if (stats) (data as any).client_stats = stats;
    return data;
  } catch (e) {
    console.error('getClientById error:', e);
    return null;
  }
}

export async function createClient(input: any) {
  if (USE_MOCK) { await delay(); const newClient = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), client_stats: { total_appointments: 0, total_spent: 0, last_visit: null } }; mockData.clients.push(newClient); return newClient; }
  
  const { data, error } = await supabase.from('clients').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, input: any) {
  if (USE_MOCK) { await delay(); const idx = mockData.clients.findIndex(c => c.id === id); if (idx >= 0) mockData.clients[idx] = { ...mockData.clients[idx], ...input }; return mockData.clients[idx]; }
  
  const { data, error } = await supabase.from('clients').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string) {
  if (USE_MOCK) { await delay(); mockData.clients = mockData.clients.filter(c => c.id !== id); return true; }
  
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getServices(activeOnly = true) {
  if (USE_MOCK) { await delay(); return activeOnly ? mockData.services.filter(s => s.active) : mockData.services; }
  try {
    
    let q = supabase.from('services').select('*').order('category').order('name');
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('getServices error:', e);
    return [];
  }
}

export async function createService(input: any) {
  if (USE_MOCK) { await delay(); const newSvc = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; mockData.services.push(newSvc); return newSvc; }
  
  const { data, error } = await supabase.from('services').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateService(id: string, input: any) {
  if (USE_MOCK) { await delay(); const idx = mockData.services.findIndex(s => s.id === id); if (idx >= 0) mockData.services[idx] = { ...mockData.services[idx], ...input }; return mockData.services[idx]; }
  
  const { data, error } = await supabase.from('services').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string) {
  if (USE_MOCK) { await delay(); mockData.services = mockData.services.filter(s => s.id !== id); return true; }
  
  // Delete appointment_services first (FK constraint)
  await supabase.from('appointment_services').delete().eq('service_id', id);
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getStaff(activeOnly = true) {
  if (USE_MOCK) { await delay(); return activeOnly ? mockData.staff.filter(s => s.active) : mockData.staff; }
  try {
    
    let q = supabase.from('staff').select('*').order('name');
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
}

export async function createStaff(input: any) {
  if (USE_MOCK) { await delay(); const newS = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), staff_stats: { total_appointments: 0, total_revenue: 0, last_appointment: null } }; mockData.staff.push(newS); return newS; }
  
  const { data, error } = await supabase.from('staff').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateStaff(id: string, input: any) {
  if (USE_MOCK) { await delay(); const idx = mockData.staff.findIndex(s => s.id === id); if (idx >= 0) mockData.staff[idx] = { ...mockData.staff[idx], ...input }; return mockData.staff[idx]; }
  
  const { data, error } = await supabase.from('staff').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStaff(id: string) {
  if (USE_MOCK) { await delay(); mockData.staff = mockData.staff.filter(s => s.id !== id); return true; }
  
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getAppointments(filters?: any) {
  if (USE_MOCK) { await delay(); return mockData.appointments; }
  try {
    
    let q = supabase.from('appointments').select(`
      *,
      client:clients(name, phone, instagram),
      artist:staff(name, photo_url, role)
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
      const { data: svcData } = await supabase
        .from('appointment_services')
        .select('appointment_id, service_id, service:services(name, price, duration_min, category)')
        .in('appointment_id', apptIds);
      if (svcData) {
        filtered.forEach((appt: any) => {
          appt.appointment_services = svcData
            .filter(s => s.appointment_id === appt.id)
            .map(s => ({ service_id: s.service_id, service: s.service }));
        });
      }
    }
    return filtered;
  } catch (e) {
    console.error('getAppointments error:', e);
    return [];
  }
}

export async function createAppointment(input: any) {
  if (USE_MOCK) { await delay(); const newAppt = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), overlap_detected: input.overlap_detected || false }; mockData.appointments.push(newAppt); return newAppt; }
  
  const { serviceIds, ...apptData } = input;
  const { data, error } = await supabase.from('appointments').insert(apptData).select().single();
  if (error) throw error;
  if (serviceIds && serviceIds.length > 0) {
    const svcRows = serviceIds.map((sid: string) => ({ appointment_id: data.id, service_id: sid }));
    await supabase.from('appointment_services').insert(svcRows);
  }
  return data;
}

export async function updateAppointment(id: string, input: any) {
  if (USE_MOCK) { await delay(); const idx = mockData.appointments.findIndex(a => a.id === id); if (idx >= 0) mockData.appointments[idx] = { ...mockData.appointments[idx], ...input }; return mockData.appointments[idx]; }
  
  const { serviceIds, ...rest } = input;
  const { data, error } = await supabase.from('appointments').update(rest).eq('id', id).select().single();
  if (error) throw error;
  
  if (serviceIds !== undefined) {
    await supabase.from('appointment_services').delete().eq('appointment_id', id);
    if (serviceIds.length > 0) {
      const svcRows = serviceIds.map((sid: string) => ({ appointment_id: id, service_id: sid }));
      await supabase.from('appointment_services').insert(svcRows);
    }
  }
  
  return data;
}

export async function checkOverlap(artistId: string, startTime: string, endTime: string, _excludeId?: string) {
  if (USE_MOCK) { await delay(); return []; }
  
  let q = supabase.from('appointments').select('id, title, start_time, end_time').eq('artist_id', artistId).in('status', ['programada', 'en_curso']).lt('start_time', endTime).gt('end_time', startTime);
  if (_excludeId) q = q.neq('id', _excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getPayments(filters?: any) {
  if (USE_MOCK) { await delay(); return mockData.payments; }
  try {
    
    let q = supabase.from('payments').select('*').order('date', { ascending: false });
    if (filters?.dateFrom) q = q.gte('date', filters.dateFrom);
    if (filters?.dateTo) q = q.lte('date', filters.dateTo);
    if (filters?.type) q = q.eq('type', filters.type);
    if (filters?.category) q = q.eq('category', filters.category);
    const { data, error } = await q;
    if (error) throw error;
    if (data && data.length > 0) {
      const clientIds = [...new Set(data.filter(p => p.client_id).map(p => p.client_id))];
      const apptIds = [...new Set(data.filter(p => p.appointment_id).map(p => p.appointment_id))];
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
}

export async function createPayment(input: any) {
  if (USE_MOCK) { await delay(); const newP = { ...input, id: String(Date.now()), created_at: new Date().toISOString() }; mockData.payments.push(newP); return newP; }
  
  const { data, error } = await supabase.from('payments').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getDashboardMetrics() {
  if (USE_MOCK) {
    await delay();
    const today = new Date().toISOString().split('T')[0];
    return {
      todayAppointments: mockData.appointments.filter(a => a.start_time.startsWith(today)),
      monthIncome: mockData.payments.filter(p => p.type === 'ingreso').reduce((s, p) => s + Number(p.amount), 0),
      monthExpenses: mockData.payments.filter(p => p.type === 'egreso').reduce((s, p) => s + Number(p.amount), 0),
      netProfit: mockData.payments.filter(p => p.type === 'ingreso').reduce((s, p) => s + Number(p.amount), 0) - mockData.payments.filter(p => p.type === 'egreso').reduce((s, p) => s + Number(p.amount), 0),
      activeClients: mockData.clients.filter(c => c.status === 'activa').length,
      pendingPayments: mockData.appointments.filter(a => a.appointment_balance?.pending_balance > 0),
      toReactivates: mockData.clients.filter(c => c.status === 'inactiva'),
    };
  }
  
  try {
    
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [todayAppts, monthIncome, monthExpenses, activeClients, toReactivates, completedAppts] = await Promise.all([
      supabase.from('appointments').select(`
        *,
        client:clients(name),
        artist:staff(name)
      `).gte('start_time', todayStart).lt('start_time', todayEnd).in('status', ['programada', 'en_curso']).order('start_time'),
      supabase.from('payments').select('amount').eq('type', 'ingreso').gte('date', firstOfMonth).lte('date', endOfMonth),
      supabase.from('payments').select('amount').eq('type', 'egreso').gte('date', firstOfMonth).lte('date', endOfMonth),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'activa'),
      supabase.from('clients').select('id, name, phone, instagram, email').eq('status', 'inactiva'),
      supabase.from('appointments').select('id, title, total_price, client_id').eq('status', 'completada'),
    ]);

    const pendingPayments: any[] = [];
    if (completedAppts.data) {
      const clientIds = [...new Set(completedAppts.data.map((a: any) => a.client_id))].filter(Boolean);
      if (clientIds.length > 0) {
        const { data: clients } = await supabase.from('clients').select('id, name').in('id', clientIds);
        const clientMap = new Map(clients?.map((c: any) => [c.id, c.name]) || []);
        for (const appt of completedAppts.data) {
          const { data: paid } = await supabase.from('payments').select('amount').eq('appointment_id', appt.id).eq('type', 'ingreso');
          const totalPaid = paid?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
          if (totalPaid < Number(appt.total_price)) {
            pendingPayments.push({ ...appt, client: { name: clientMap.get(appt.client_id) || 'Sin clienta' } });
          }
        }
      }
    }

    const totalIncome = monthIncome.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const totalExpenses = monthExpenses.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    
    return {
      todayAppointments: todayAppts.data || [],
      monthIncome: totalIncome,
      monthExpenses: totalExpenses,
      netProfit: totalIncome - totalExpenses,
      activeClients: activeClients.count || 0,
      pendingPayments,
      toReactivates: toReactivates.data || [],
    };
  } catch (e) {
    console.error('getDashboardMetrics error:', e);
    return { todayAppointments: [], monthIncome: 0, monthExpenses: 0, netProfit: 0, activeClients: 0, pendingPayments: [], toReactivates: [] };
  }
}

export async function getAllClientsForSelect() {
  if (USE_MOCK) { await delay(); return mockData.clients.map(c => ({ id: c.id, name: c.name })); }
  try {
    
    const { data, error } = await supabase.from('clients').select('id, name').order('name');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('getAllClientsForSelect error:', e);
    return [];
  }
}
