const MOCK_CLIENTS = [
  { id: '1', name: 'María García', phone: '+51 987 654 321', email: 'maria@email.com', instagram: '@maria.g', status: 'activa', notes: 'Alergia a acetona', photo_url: null, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z', client_stats: { total_appointments: 12, total_spent: 450, last_visit: '2025-05-02T14:00:00Z' } },
  { id: '2', name: 'Ana López', phone: '+51 912 345 678', email: '', instagram: '@analopez', status: 'vip', notes: '', photo_url: null, created_at: '2025-02-20T10:00:00Z', updated_at: '2025-02-20T10:00:00Z', client_stats: { total_appointments: 28, total_spent: 1200, last_visit: '2025-05-05T11:00:00Z' } },
  { id: '3', name: 'Carla Ruiz', phone: '+51 999 888 777', email: 'carla@email.com', instagram: '', status: 'prospecto', notes: 'Vino por recomendación', photo_url: null, created_at: '2025-04-10T10:00:00Z', updated_at: '2025-04-10T10:00:00Z', client_stats: { total_appointments: 0, total_spent: 0, last_visit: null } },
  { id: '4', name: 'Lucía Torres', phone: '+51 955 444 333', email: 'lucia@email.com', instagram: '@lucia.t', status: 'activa', notes: '', photo_url: null, created_at: '2025-03-05T10:00:00Z', updated_at: '2025-03-05T10:00:00Z', client_stats: { total_appointments: 5, total_spent: 200, last_visit: '2025-04-20T16:00:00Z' } },
  { id: '5', name: 'Sofía Mendoza', phone: '', email: '', instagram: '@sofiam', status: 'inactiva', notes: 'No vuelve hace 3 meses', photo_url: null, created_at: '2024-12-01T10:00:00Z', updated_at: '2024-12-01T10:00:00Z', client_stats: { total_appointments: 3, total_spent: 90, last_visit: '2025-02-01T10:00:00Z' } },
];

const MOCK_SERVICES = [
  { id: '1', name: 'Acrílico completo', category: 'sistema_unas', duration_min: 90, price: 80, description: 'Uñas acrílicas con diseño básico', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '2', name: 'Rubber base', category: 'sistema_unas', duration_min: 60, price: 60, description: 'Rubber base semipermanente', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '3', name: 'Soft gel', category: 'sistema_unas', duration_min: 75, price: 70, description: 'Soft gel press on personalizado', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '4', name: 'Pedicura spa', category: 'pedicura', duration_min: 45, price: 50, description: 'Pedicura completa con mascarilla', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '5', name: 'Pestañas clásicas', category: 'pestanas', duration_min: 90, price: 100, description: 'Extensiones pelo a pelo', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '6', name: 'Pestañas volumen', category: 'pestanas', duration_min: 120, price: 140, description: 'Volumen ruso 2D-3D', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '7', name: 'Maquillaje social', category: 'makeup', duration_min: 60, price: 120, description: 'Maquillaje para eventos', image_url: null, active: true, created_at: '', updated_at: '' },
  { id: '8', name: 'Diseño de cejas', category: 'cejas', duration_min: 30, price: 35, description: 'Perfilado y diseño', image_url: null, active: true, created_at: '', updated_at: '' },
];

const MOCK_STAFF = [
  { id: '1', name: 'Valentina Ríos', phone: '+51 911 222 333', role: 'nail_artist', specialties: ['sistema_unas', 'pedicura'], commission_pct: 30, schedule: 'Lun-Sáb 9:00-18:00', photo_url: null, active: true, last_commission_paid: null, created_at: '', updated_at: '', staff_stats: { total_appointments: 45, total_revenue: 3200, last_appointment: '2025-05-05T14:00:00Z' } },
  { id: '2', name: 'Camila Vega', phone: '+51 922 333 444', role: 'lashista', specialties: ['pestanas', 'cejas'], commission_pct: 35, schedule: 'Mar-Sáb 10:00-19:00', photo_url: null, active: true, last_commission_paid: null, created_at: '', updated_at: '', staff_stats: { total_appointments: 30, total_revenue: 2800, last_appointment: '2025-05-04T16:00:00Z' } },
  { id: '3', name: 'Isabella Mora', phone: '+51 933 444 555', role: 'maquillista', specialties: ['makeup', 'cejas'], commission_pct: 40, schedule: 'Lun-Vie 10:00-17:00', photo_url: null, active: true, last_commission_paid: null, created_at: '', updated_at: '', staff_stats: { total_appointments: 15, total_revenue: 1500, last_appointment: '2025-05-03T11:00:00Z' } },
];

const MOCK_APPOINTMENTS = [
  { id: '1', client_id: '1', artist_id: '1', title: 'Acrílico + Pedicura', start_time: new Date().toISOString(), end_time: new Date(Date.now() + 135 * 60000).toISOString(), status: 'programada', total_price: 130, total_duration_min: 135, notes: '', overlap_detected: false, created_at: '', updated_at: '', client: { name: 'María García', phone: '+51 987 654 321' }, artist: { name: 'Valentina Ríos', photo_url: null }, appointment_services: [{ service: { name: 'Acrílico completo', price: 80, duration_min: 90, category: 'sistema_unas' } }, { service: { name: 'Pedicura spa', price: 50, duration_min: 45, category: 'pedicura' } }], appointment_balance: { total_price: 130, total_paid: 10, pending_balance: 120, paid_in_full: false } },
  { id: '2', client_id: '2', artist_id: '2', title: 'Pestañas volumen', start_time: new Date(Date.now() + 2 * 3600000).toISOString(), end_time: new Date(Date.now() + 2 * 3600000 + 120 * 60000).toISOString(), status: 'programada', total_price: 140, total_duration_min: 120, notes: '', overlap_detected: false, created_at: '', updated_at: '', client: { name: 'Ana López', phone: '' }, artist: { name: 'Camila Vega', photo_url: null }, appointment_services: [{ service: { name: 'Pestañas volumen', price: 140, duration_min: 120, category: 'pestanas' } }], appointment_balance: { total_price: 140, total_paid: 10, pending_balance: 130, paid_in_full: false } },
  { id: '3', client_id: '4', artist_id: '1', title: 'Soft gel', start_time: new Date(Date.now() - 86400000).toISOString(), end_time: new Date(Date.now() - 86400000 + 75 * 60000).toISOString(), status: 'completada', total_price: 70, total_duration_min: 75, notes: '', overlap_detected: false, created_at: '', updated_at: '', client: { name: 'Lucía Torres', phone: '' }, artist: { name: 'Valentina Ríos', photo_url: null }, appointment_services: [{ service: { name: 'Soft gel', price: 70, duration_min: 75, category: 'sistema_unas' } }], appointment_balance: { total_price: 70, total_paid: 70, pending_balance: 0, paid_in_full: true } },
];

const MOCK_PAYMENTS = [
  { id: '1', concept: 'Reserva — María García', date: new Date().toISOString().split('T')[0], amount: 10, type: 'ingreso', category: 'servicio', payment_kind: 'reserva', payment_method: 'yape_plin', appointment_id: '1', client_id: '1', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'María García' }, appointment: { title: 'Acrílico + Pedicura' } },
  { id: '2', concept: 'Reserva — Ana López', date: new Date().toISOString().split('T')[0], amount: 10, type: 'ingreso', category: 'servicio', payment_kind: 'reserva', payment_method: 'efectivo', appointment_id: '2', client_id: '2', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'Ana López' }, appointment: { title: 'Pestañas volumen' } },
  { id: '3', concept: 'Pago final — Lucía Torres', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 70, type: 'ingreso', category: 'servicio', payment_kind: 'pago_final', payment_method: 'efectivo', appointment_id: '3', client_id: '4', receipt_url: null, paid: true, created_at: '', updated_at: '', client: { name: 'Lucía Torres' }, appointment: { title: 'Soft gel' } },
  { id: '4', concept: 'Compra de esmaltes', date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], amount: 150, type: 'egreso', category: 'insumo', payment_kind: null, payment_method: 'tarjeta', appointment_id: null, client_id: null, receipt_url: null, paid: true, created_at: '', updated_at: '', client: null, appointment: null },
  { id: '5', concept: 'Comisión — Valentina Ríos', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], amount: 960, type: 'egreso', category: 'comisiones', payment_kind: null, payment_method: 'transferencia', appointment_id: null, client_id: null, receipt_url: null, paid: true, created_at: '', updated_at: '', client: null, appointment: null },
];

export const mockData = {
  clients: MOCK_CLIENTS,
  services: MOCK_SERVICES,
  staff: MOCK_STAFF,
  appointments: MOCK_APPOINTMENTS,
  payments: MOCK_PAYMENTS,
};
