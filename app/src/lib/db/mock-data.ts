const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Sistema de uñas', slug: 'sistema_unas', description: 'Uñas acrílicas, gel, press-on, manicure', color: '#8B5CF6', icon: '💅', active: true, sort_order: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Pedicura', slug: 'pedicura', description: 'Pedicure spa, exfoliación, masajes', color: '#3B82F6', icon: '🦶', active: true, sort_order: 2, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Makeup', slug: 'makeup', description: 'Maquillaje social, artístico, eventos', color: '#EC4899', icon: '💄', active: true, sort_order: 3, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-4', name: 'Pestañas', slug: 'pestanas', description: 'Extensiones clásicas, volumen, lifting', color: '#F97316', icon: '👁️', active: true, sort_order: 4, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-5', name: 'Cejas', slug: 'cejas', description: 'Perfilado, laminado, microblading', color: '#EAB308', icon: '✨', active: true, sort_order: 5, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
];

function getCategoryById(id: string) {
  return MOCK_CATEGORIES.find(c => c.id === id) || MOCK_CATEGORIES[0];
}

const MOCK_CLIENTS = [
  { id: '1', name: 'María García', phone: '+51 987 654 321', email: 'maria@email.com', instagram: '@maria.g', status: 'activa', notes: 'Alergia a acetona', photo_url: null, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z', client_stats: { total_appointments: 12, total_spent: 450, last_visit: '2025-05-02T14:00:00Z' } },
  { id: '2', name: 'Ana López', phone: '+51 912 345 678', email: '', instagram: '@analopez', status: 'vip', notes: '', photo_url: null, created_at: '2025-02-20T10:00:00Z', updated_at: '2025-02-20T10:00:00Z', client_stats: { total_appointments: 28, total_spent: 1200, last_visit: '2025-05-05T11:00:00Z' } },
  { id: '3', name: 'Carla Ruiz', phone: '+51 999 888 777', email: 'carla@email.com', instagram: '', status: 'prospecto', notes: 'Vino por recomendación', photo_url: null, created_at: '2025-04-10T10:00:00Z', updated_at: '2025-04-10T10:00:00Z', client_stats: { total_appointments: 0, total_spent: 0, last_visit: null } },
  { id: '4', name: 'Lucía Torres', phone: '+51 955 444 333', email: 'lucia@email.com', instagram: '@lucia.t', status: 'activa', notes: '', photo_url: null, created_at: '2025-03-05T10:00:00Z', updated_at: '2025-03-05T10:00:00Z', client_stats: { total_appointments: 5, total_spent: 200, last_visit: '2025-04-20T16:00:00Z' } },
  { id: '5', name: 'Sofía Mendoza', phone: '', email: '', instagram: '@sofiam', status: 'inactiva', notes: 'No vuelve hace 3 meses', photo_url: null, created_at: '2024-12-01T10:00:00Z', updated_at: '2024-12-01T10:00:00Z', client_stats: { total_appointments: 3, total_spent: 90, last_visit: '2025-02-01T10:00:00Z' } },
];

const MOCK_SERVICES = [
  { id: 'svc-1', name: 'Acrílico completo', category_id: 'cat-1', category: getCategoryById('cat-1'), duration_min: 90, price: 80, description: 'Uñas acrílicas con diseño básico', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-2', name: 'Rubber base', category_id: 'cat-1', category: getCategoryById('cat-1'), duration_min: 60, price: 60, description: 'Rubber base semipermanente', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-3', name: 'Soft gel', category_id: 'cat-1', category: getCategoryById('cat-1'), duration_min: 75, price: 70, description: 'Soft gel press on personalizado', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-4', name: 'Pedicura spa', category_id: 'cat-2', category: getCategoryById('cat-2'), duration_min: 45, price: 50, description: 'Pedicura completa con mascarilla', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-5', name: 'Pestañas clásicas', category_id: 'cat-4', category: getCategoryById('cat-4'), duration_min: 90, price: 100, description: 'Extensiones pelo a pelo', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-6', name: 'Pestañas volumen', category_id: 'cat-4', category: getCategoryById('cat-4'), duration_min: 120, price: 140, description: 'Volumen ruso 2D-3D', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-7', name: 'Maquillaje social', category_id: 'cat-3', category: getCategoryById('cat-3'), duration_min: 60, price: 120, description: 'Maquillaje para eventos', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: 'svc-8', name: 'Diseño de cejas', category_id: 'cat-5', category: getCategoryById('cat-5'), duration_min: 30, price: 35, description: 'Perfilado y diseño', image_url: null, active: true, created_at: '', updated_at: '' },
];

 const MOCK_ROLES = [
   { id: '1', name: 'Nail Artist', description: 'Sistema de uñas, manicure, pedicure', color: '#8B5CF6', active: true, created_at: '', updated_at: '' },
   { id: '2', name: 'Lashista', description: 'Extensiones de pestañas', color: '#EC4899', active: true, created_at: '', updated_at: '' },
   { id: '3', name: 'Pedicurista', description: 'Pedicure profesional', color: '#3B82F6', active: true, created_at: '', updated_at: '' },
   { id: '4', name: 'Maquillista', description: 'Maquillaje profesional', color: '#EF4444', active: true, created_at: '', updated_at: '' },
   { id: '5', name: 'Founder', description: 'Owner/CEO del salón', color: '#F59E0B', active: true, created_at: '', updated_at: '' },
 ];

const MOCK_STAFF = [
  { 
    id: 'staff-1', 
    name: 'Valentina Ríos', 
    phone: '+51 911 222 333', 
    role_id: '1', 
    role: { name: 'Nail Artist', color: '#8B5CF6' }, 
    staff_specialties: [
      { id: 'ss-1', staff_id: 'staff-1', category_id: 'cat-1', category: getCategoryById('cat-1'), created_at: '' },
      { id: 'ss-2', staff_id: 'staff-1', category_id: 'cat-2', category: getCategoryById('cat-2'), created_at: '' },
    ],
    commission_pct: 70, 
    schedule: 'Lun-Sáb 9:00-18:00', 
    photo_url: null, 
    active: true, 
    last_commission_paid: null, 
    created_at: '', 
    updated_at: '', 
    staff_stats: { total_appointments: 45, total_revenue: 3200, last_appointment: '2025-05-05T14:00:00Z' } 
  },
  { 
    id: 'staff-2', 
    name: 'Camila Vega', 
    phone: '+51 922 333 444', 
    role_id: '2', 
    role: { name: 'Lashista', color: '#EC4899' }, 
    staff_specialties: [
      { id: 'ss-3', staff_id: 'staff-2', category_id: 'cat-4', category: getCategoryById('cat-4'), created_at: '' },
      { id: 'ss-4', staff_id: 'staff-2', category_id: 'cat-5', category: getCategoryById('cat-5'), created_at: '' },
    ],
    commission_pct: 70, 
    schedule: 'Mar-Sáb 10:00-19:00', 
    photo_url: null, 
    active: true, 
    last_commission_paid: null, 
    created_at: '', 
    updated_at: '', 
    staff_stats: { total_appointments: 30, total_revenue: 2800, last_appointment: '2025-05-04T16:00:00Z' } 
  },
  { 
    id: 'staff-3', 
    name: 'Isabella Mora', 
    phone: '+51 933 444 555', 
    role_id: '4', 
    role: { name: 'Maquillista', color: '#EF4444' }, 
    staff_specialties: [
      { id: 'ss-5', staff_id: 'staff-3', category_id: 'cat-3', category: getCategoryById('cat-3'), created_at: '' },
      { id: 'ss-6', staff_id: 'staff-3', category_id: 'cat-5', category: getCategoryById('cat-5'), created_at: '' },
    ],
    commission_pct: 60, 
    schedule: 'Lun-Vie 10:00-17:00', 
    photo_url: null, 
    active: true, 
    last_commission_paid: null, 
    created_at: '', 
    updated_at: '', 
    staff_stats: { total_appointments: 15, total_revenue: 1500, last_appointment: '2025-05-03T11:00:00Z' } 
  },
   { 
     id: 'staff-founder', 
     name: 'Araceli Zevallos', 
     phone: '+51 962 686 557', 
     role_id: '5', 
     role: { name: 'Founder', color: '#F59E0B' }, 
     staff_specialties: [
       { id: 'ss-f1', staff_id: 'staff-founder', category_id: 'cat-1', category: getCategoryById('cat-1'), created_at: '' },
       { id: 'ss-f2', staff_id: 'staff-founder', category_id: 'cat-2', category: getCategoryById('cat-2'), created_at: '' },
       { id: 'ss-f3', staff_id: 'staff-founder', category_id: 'cat-3', category: getCategoryById('cat-3'), created_at: '' },
     ],
     commission_pct: 100, 
     schedule: 'Lun-Sáb 9:00-20:00', 
     photo_url: null, 
     active: true, 
     last_commission_paid: null, 
     birthday_date: '1990-11-09',
     created_at: '', 
     updated_at: '', 
     staff_stats: { total_appointments: 10, total_revenue: 2000, last_appointment: '2025-05-05T10:00:00Z' } 
   },
];

const MOCK_COMMISSION_OVERRIDES = [
  {
    id: 'co-1',
    staff_id: 'staff-1',
    service_id: 'svc-4',
    founder_fixed_amount: 5,
    created_at: '',
    updated_at: '',
    service: { name: 'Pedicura spa', price: 50 }
  },
  {
    id: 'co-2',
    staff_id: 'staff-2',
    service_id: 'svc-8',
    founder_fixed_amount: 5,
    created_at: '',
    updated_at: '',
    service: { name: 'Diseño de cejas', price: 35 }
  },
];

const MOCK_APPOINTMENTS = [
  { 
    id: 'appt-1', 
    client_id: '1', 
    artist_id: 'staff-1', 
    title: 'Acrílico + Pedicura', 
    start_time: new Date().toISOString(), 
    end_time: new Date(Date.now() + 135 * 60000).toISOString(), 
    status: 'programada', 
    total_price: 130, 
    total_duration_min: 135, 
    notes: '', 
    overlap_detected: false, 
    created_at: '', 
    updated_at: '', 
    client: { name: 'María García', phone: '+51 987 654 321' }, 
    artist: { name: 'Valentina Ríos', photo_url: null }, 
    appointment_services: [
      { 
        service_id: 'svc-1', 
        artist_id: 'staff-1',
        artist: { name: 'Valentina Ríos', photo_url: null },
        service: { name: 'Acrílico completo', price: 80, duration_min: 90, category_id: 'cat-1', category: getCategoryById('cat-1') },
      }, 
      { 
        service_id: 'svc-4', 
        artist_id: 'staff-1',
        artist: { name: 'Valentina Ríos', photo_url: null },
        service: { name: 'Pedicura spa', price: 50, duration_min: 45, category_id: 'cat-2', category: getCategoryById('cat-2') },
      }
    ], 
    appointment_balance: { total_price: 130, total_paid: 10, pending_balance: 120, paid_in_full: false } 
  },
  { 
    id: 'appt-2', 
    client_id: '2', 
    artist_id: 'staff-2', 
    title: 'Pestañas volumen + Cejas', 
    start_time: new Date(Date.now() + 2 * 3600000).toISOString(), 
    end_time: new Date(Date.now() + 2 * 3600000 + 150 * 60000).toISOString(), 
    status: 'programada', 
    total_price: 175, 
    total_duration_min: 150, 
    notes: '', 
    overlap_detected: false, 
    created_at: '', 
    updated_at: '', 
    client: { name: 'Ana López', phone: '' }, 
    artist: { name: 'Camila Vega', photo_url: null }, 
    appointment_services: [
      { 
        service_id: 'svc-6', 
        artist_id: 'staff-2',
        artist: { name: 'Camila Vega', photo_url: null },
        service: { name: 'Pestañas volumen', price: 140, duration_min: 120, category_id: 'cat-4', category: getCategoryById('cat-4') },
      },
      { 
        service_id: 'svc-8', 
        artist_id: 'staff-2',
        artist: { name: 'Camila Vega', photo_url: null },
        service: { name: 'Diseño de cejas', price: 35, duration_min: 30, category_id: 'cat-5', category: getCategoryById('cat-5') },
      }
    ], 
    appointment_balance: { total_price: 175, total_paid: 10, pending_balance: 165, paid_in_full: false } 
  },
  { 
    id: 'appt-3', 
    client_id: '4', 
    artist_id: 'staff-1', 
    title: 'Soft gel', 
    start_time: new Date(Date.now() - 86400000).toISOString(), 
    end_time: new Date(Date.now() - 86400000 + 75 * 60000).toISOString(), 
    status: 'completada', 
    total_price: 70, 
    total_duration_min: 75, 
    notes: '', 
    overlap_detected: false, 
    created_at: '', 
    updated_at: '', 
    client: { name: 'Lucía Torres', phone: '' }, 
    artist: { name: 'Valentina Ríos', photo_url: null }, 
    appointment_services: [
      { 
        service_id: 'svc-3', 
        artist_id: 'staff-1',
        artist: { name: 'Valentina Ríos', photo_url: null },
        service: { name: 'Soft gel', price: 70, duration_min: 75, category_id: 'cat-1', category: getCategoryById('cat-1') },
      }
    ], 
    appointment_balance: { total_price: 70, total_paid: 70, pending_balance: 0, paid_in_full: true } 
  },
  { 
    id: 'appt-4', 
    client_id: '2', 
     artist_id: 'staff-founder', 
     title: 'Makeup social (Araceli)', 
     start_time: new Date(Date.now() - 2 * 86400000).toISOString(), 
     end_time: new Date(Date.now() - 2 * 86400000 + 60 * 60000).toISOString(), 
     status: 'completada', 
     total_price: 120, 
     total_duration_min: 60, 
     notes: '', 
     overlap_detected: false, 
     created_at: '', 
     updated_at: '', 
     client: { name: 'Ana López', phone: '' }, 
     artist: { name: 'Araceli Zevallos', photo_url: null }, 
     appointment_services: [
       { 
         service_id: 'svc-7', 
         artist_id: 'staff-founder',
         artist: { name: 'Araceli Zevallos', photo_url: null },
         service: { name: 'Maquillaje social', price: 120, duration_min: 60, category_id: 'cat-3', category: getCategoryById('cat-3') },
       }
     ],
    appointment_balance: { total_price: 120, total_paid: 120, pending_balance: 0, paid_in_full: true } 
  },
];

const MOCK_PAYMENTS = [
  { id: '1', concept: 'Reserva — María García', date: new Date().toISOString().split('T')[0], amount: 10, type: 'ingreso', category: 'servicio', payment_kind: 'reserva', payment_method: 'yape_plin', appointment_id: 'appt-1', client_id: '1', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'María García' }, appointment: { title: 'Acrílico + Pedicura' } },
  { id: '2', concept: 'Reserva — Ana López', date: new Date().toISOString().split('T')[0], amount: 10, type: 'ingreso', category: 'servicio', payment_kind: 'reserva', payment_method: 'efectivo', appointment_id: 'appt-2', client_id: '2', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'Ana López' }, appointment: { title: 'Pestañas volumen + Cejas' } },
  { id: '3', concept: 'Pago final — Lucía Torres', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 70, type: 'ingreso', category: 'servicio', payment_kind: 'pago_final', payment_method: 'efectivo', appointment_id: 'appt-3', client_id: '4', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'Lucía Torres' }, appointment: { title: 'Soft gel' } },
  { id: '4', concept: 'Compra de esmaltes', date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], amount: 150, type: 'egreso', category: 'insumo', payment_kind: null, payment_method: 'tarjeta', appointment_id: null, client_id: null, receipt_url: null, paid: true, created_at: '', updated_at: '', client: null, appointment: null },
  { id: '5', concept: 'Comisión — Valentina Ríos', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], amount: 960, type: 'egreso', category: 'comisiones', payment_kind: null, payment_method: 'transferencia', appointment_id: null, client_id: null, receipt_url: null, paid: true, created_at: '', updated_at: '', client: null, appointment: null },
];

export const mockData = {
  clients: MOCK_CLIENTS,
  services: MOCK_SERVICES,
  staff: MOCK_STAFF,
  appointments: MOCK_APPOINTMENTS,
  payments: MOCK_PAYMENTS,
  roles: MOCK_ROLES,
  categories: MOCK_CATEGORIES,
  commissionOverrides: MOCK_COMMISSION_OVERRIDES,
};
