export interface AppointmentDTO {
  id: string;
  title: string;
  start_time: string;
  total_duration_min: number;
  total_price: number;
  status: string;
  client?: { name: string } | null;
  artist?: { name: string; role?: { name: string } | null } | null;
}

export interface PendingPaymentDTO {
  id: string;
  title: string;
  total_price: number;
  client?: { name: string } | null;
}

export interface ReactivationClientDTO {
  id: string;
  name: string;
  phone?: string | null;
  instagram?: string | null;
  email?: string | null;
}

export interface BirthdayItem {
  id: string;
  name: string;
  next_birthday: string;
  days_left: number;
  is_today: boolean;
}

export interface WeekTrend {
  date: string;
  amount: number;
}

export interface StaffOccupancyDTO {
  id: string;
  name: string;
  appointmentCount: number;
  totalDurationMin: number;
  capacityPercent: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'cita_creada' | 'pago_registrado' | 'cita_completada' | 'clienta_nueva';
  description: string;
  timestamp: string;
  href?: string;
}

export interface DashboardMetrics {
  todayAppointments: AppointmentDTO[];
  monthIncome: number;
  monthExpenses: number;
  netProfit: number;
  activeClients: number;
  weekIncome: number;
  lastWeekIncome: number;
  weekExpenses: number;
  lastWeekExpenses: number;
  weekTrend: WeekTrend[];
  pendingPayments: PendingPaymentDTO[];
  toReactivates: ReactivationClientDTO[];
  upcomingBirthdays: BirthdayItem[];
  staffOccupancy: StaffOccupancyDTO[];
  recentActivity: ActivityItem[];
  totalAppointmentsToday: number;
}

export interface MonthlyReport {
  completedAppointments: number;
  totalAppointments: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  newClients: Array<{ id: string; name: string }>;
  topServices: Array<{ service_id: string; name: string; count: number; revenue: number }>;
  topArtists: Array<{ artist_id: string; artist_name: string; totalRevenue: number; totalServices: number; totalCommission: number }>;
  inactiveClients: Array<{ id: string; name: string }>;
}

export interface DashboardSkeletonProps {
  header?: React.ReactNode;
}
