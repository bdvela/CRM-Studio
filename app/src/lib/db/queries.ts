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

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export async function getCategories(activeOnly = true) {
  if (USE_MOCK) { await delay(); return activeOnly ? mockData.categories?.filter((c: any) => c.active) || [] : mockData.categories || []; }
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
}

export async function createCategory(input: any) {
  if (USE_MOCK) {
    await delay();
    const newCat = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active: true };
    if (!mockData.categories) mockData.categories = [];
    mockData.categories.push(newCat);
    return newCat;
  }
  const { data, error } = await supabase.from('categories').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, input: any) {
  if (USE_MOCK) {
    await delay();
    if (!mockData.categories) mockData.categories = [];
    const idx = mockData.categories.findIndex((c: any) => c.id === id);
    if (idx >= 0) mockData.categories[idx] = { ...mockData.categories[idx], ...input };
    return mockData.categories[idx];
  }
  const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  if (USE_MOCK) {
    await delay();
    if (!mockData.categories) mockData.categories = [];
    mockData.categories = mockData.categories.filter((c: any) => c.id !== id);
    return true;
  }
  const { data: servicesUsing, error: svcErr } = await supabase.from('services').select('id').eq('category_id', id).limit(1);
  if (svcErr) throw svcErr;
  if (servicesUsing && servicesUsing.length > 0) throw new Error('No se puede eliminar: hay servicios con esta categoría');
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ─── SERVICES ───────────────────────────────────────────────────────────────

export async function getServices(activeOnly = true) {
  if (USE_MOCK) { 
    await delay(); 
    let result = activeOnly ? mockData.services.filter(s => s.active) : mockData.services;
    return result.map(svc => ({
      ...svc,
      staff_services: (mockData.staffServices || []).filter((ss: any) => ss.service_id === svc.id)
    }));
  }
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
  if (USE_MOCK) { 
    await delay(); 
    mockData.services = mockData.services.filter(s => s.id !== id); 
    if (mockData.staffServices) {
      mockData.staffServices = (mockData.staffServices as any[]).filter((s: any) => s.service_id !== id);
    }
    return true; 
  }
  
  try {
    await supabase.from('staff_services').delete().eq('service_id', id);
  } catch (e) {
    console.log('staff_services table may not exist, skipping:', e);
  }
  await supabase.from('appointment_services').delete().eq('service_id', id);
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getStaffServicesByService(serviceId: string) {
  if (USE_MOCK) {
    await delay();
    return (mockData.staffServices || []).filter((s: any) => s.service_id === serviceId);
  }
  try {
    const { data, error } = await supabase
      .from('staff_services')
      .select('*')
      .eq('service_id', serviceId);
    if (error) {
      console.log('staff_services table may not exist:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.log('getStaffServicesByService (table may not exist):', e);
    return [];
  }
}

export async function updateStaffServices(serviceId: string, staffIds: string[]) {
  if (USE_MOCK) {
    await delay();
    if (!mockData.staffServices) mockData.staffServices = [];
    mockData.staffServices = (mockData.staffServices as any[]).filter((s: any) => s.service_id !== serviceId);
    for (const staffId of staffIds) {
      (mockData.staffServices as any[]).push({
        id: String(Date.now()),
        service_id: serviceId,
        staff_id: staffId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return true;
  }
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
  if (USE_MOCK) {
    await delay();
    
    const explicitAssignments = (mockData.staffServices || []).filter((s: any) => s.service_id === serviceId);
    
    if (explicitAssignments.length > 0) {
      const assignedStaffIds = explicitAssignments.map((s: any) => s.staff_id);
      let staff = mockData.staff;
      if (activeOnly) staff = staff.filter((s: any) => s.active);
      return staff.filter((s: any) => assignedStaffIds.includes(s.id));
    }
    
    if (categoryId) {
      let staff = mockData.staff;
      if (activeOnly) staff = staff.filter((s: any) => s.active);
      return staff.filter((s: any) => 
        (s.staff_specialties || []).some((sp: any) => sp.category_id === categoryId)
      );
    }
    
    let staff = mockData.staff;
    if (activeOnly) staff = staff.filter((s: any) => s.active);
    return staff;
  }
  
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
  if (USE_MOCK) { await delay(); return activeOnly ? mockData.staff.filter(s => s.active) : mockData.staff; }
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
}

export async function updateStaffSpecialties(staffId: string, categoryIds: string[]) {
  if (USE_MOCK) {
    await delay();
    return true;
  }
  try {
    await supabase.from('staff_specialties').delete().eq('staff_id', staffId);
    if (categoryIds.length > 0) {
      const rows = categoryIds.map(cid => ({ staff_id: staffId, category_id: cid }));
      await supabase.from('staff_specialties').insert(rows);
    }
    return true;
  } catch (e) {
    console.error('updateStaffSpecialties error:', e);
    throw e;
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

// ─── ROLES ──────────────────────────────────────────────────────────────────

export async function getRoles(activeOnly = true) {
  if (USE_MOCK) { await delay(); return activeOnly ? mockData.roles?.filter((r: any) => r.active) || [] : mockData.roles || []; }
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
}

export async function createRole(input: any) {
  if (USE_MOCK) {
    await delay();
    const newR = { ...input, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active: true };
    if (!mockData.roles) mockData.roles = [];
    mockData.roles.push(newR);
    return newR;
  }
  const { data, error } = await supabase.from('roles').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRole(id: string, input: any) {
  if (USE_MOCK) {
    await delay();
    if (!mockData.roles) mockData.roles = [];
    const idx = mockData.roles.findIndex((r: any) => r.id === id);
    if (idx >= 0) mockData.roles[idx] = { ...mockData.roles[idx], ...input };
    return mockData.roles[idx];
  }
  const { data, error } = await supabase.from('roles').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRole(id: string) {
  if (USE_MOCK) {
    await delay();
    if (!mockData.roles) mockData.roles = [];
    mockData.roles = mockData.roles.filter((r: any) => r.id !== id);
    return true;
  }
  // Check if any staff uses this role
  const { data: staffUsing, error: staffErr } = await supabase.from('staff').select('id').eq('role_id', id).limit(1);
  if (staffErr) throw staffErr;
  if (staffUsing && staffUsing.length > 0) throw new Error('No se puede eliminar: hay staff asignado a este rol');
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getAppointments(filters?: any) {
  if (USE_MOCK) { await delay(); return mockData.appointments; }
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
       const { data: svcData } = await supabase
         .from('appointment_services')
         .select('appointment_id, service_id, artist_id, service:services(name, price, duration_min, category_id, category:categories(*)), artist:staff(name, photo_url)')
         .in('appointment_id', apptIds);
       
       let commissionMap = new Map<string, any[]>();
       try {
         const { data: commData } = await supabase
           .from('commission_details')
           .select('*')
           .in('appointment_id', apptIds);
         if (commData) {
           for (const cd of commData) {
             const existing = commissionMap.get(cd.appointment_id) || [];
             existing.push(cd);
             commissionMap.set(cd.appointment_id, existing);
           }
         }
       } catch (e) {
         console.log('commission details view may not exist yet', e);
       }
       
       if (svcData) {
         filtered.forEach((appt: any) => {
           const apptServices = svcData
             .filter(s => s.appointment_id === appt.id);
           
           appt.appointment_services = apptServices.map(s => {
             const svc: any = { 
               service_id: s.service_id, 
               artist_id: s.artist_id || null,
               service: s.service 
             };
             if (s.artist) svc.artist = s.artist;
             
             const comms = commissionMap.get(appt.id) || [];
             const cd = comms.find((c: any) => c.appointment_service_id === s.service_id);
             if (cd) svc.commission_detail = cd;
             
             return svc;
           });
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
  
  const { serviceIds, services, ...apptData } = input;
  const { data, error } = await supabase.from('appointments').insert(apptData).select().single();
  if (error) throw error;
  
  const serviceInputs = services || (serviceIds ? serviceIds.map((sid: string) => ({ service_id: sid })) : []);
  if (serviceInputs && serviceInputs.length > 0) {
    const svcRows = serviceInputs.map((si: any) => ({ 
      appointment_id: data.id, 
      service_id: si.service_id,
      artist_id: si.artist_id || null,
    }));
    await supabase.from('appointment_services').insert(svcRows);
  }
  return data;
}

export async function updateAppointment(id: string, input: any) {
  if (USE_MOCK) { await delay(); const idx = mockData.appointments.findIndex(a => a.id === id); if (idx >= 0) mockData.appointments[idx] = { ...mockData.appointments[idx], ...input }; return mockData.appointments[idx]; }
  
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
      }));
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
        artist:staff(name, role:roles(name))
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

// ─── COMMISSION OVERRIDES ───────────────────────────────────────────────────

export async function getCommissionOverrides(staffId: string) {
  if (USE_MOCK) {
    await delay();
    return mockData.commissionOverrides?.filter((o: any) => o.staff_id === staffId) || [];
  }
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
  if (USE_MOCK) {
    await delay();
    if (!mockData.commissionOverrides) mockData.commissionOverrides = [];
    const existingIdx = mockData.commissionOverrides.findIndex(
      (o: any) => o.staff_id === input.staff_id && o.service_id === input.service_id
    );
    const now = new Date().toISOString();
    if (existingIdx >= 0) {
      mockData.commissionOverrides[existingIdx] = {
        ...mockData.commissionOverrides[existingIdx],
        ...input,
        updated_at: now,
      } as any;
    } else {
      mockData.commissionOverrides.push({
        ...input,
        id: String(Date.now()),
        created_at: now,
        updated_at: now,
      } as any);
    }
    return true;
  }
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
  if (USE_MOCK) {
    await delay();
    if (!mockData.commissionOverrides) return true;
    mockData.commissionOverrides = mockData.commissionOverrides.filter(
      (o: any) => !(o.staff_id === staffId && o.service_id === serviceId)
    );
    return true;
  }
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
  if (USE_MOCK) {
    await delay();
    return [
      {
        artist_id: 'staff-1',
        artist_name: 'Valentina Ríos',
        total_services: 1,
        total_service_revenue: 70,
        total_artist_commission: 49,
        total_founder_share: 21,
      },
      {
        artist_id: 'staff-founder',
        artist_name: 'Sofía Castillo',
        total_services: 1,
        total_service_revenue: 120,
        total_artist_commission: 120,
        total_founder_share: 0,
      },
    ];
  }
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
    
    const map = new Map<string, {
      artist_id: string | null;
      artist_name: string | null;
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
}
