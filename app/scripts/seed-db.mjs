import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from app/.env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DATES = {
  today: new Date(),
  yesterday: new Date(new Date().setDate(new Date().getDate() - 1)),
  tomorrow: new Date(new Date().setDate(new Date().getDate() + 1)),
  in_a_week: new Date(new Date().setDate(new Date().getDate() + 7)),
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTime(date) {
  const d = new Date(date);
  d.setHours(Math.floor(Math.random() * (20 - 9 + 1)) + 9, Math.floor(Math.random() * 4) * 15, 0, 0);
  return d.toISOString();
}

async function cleanData() {
  console.log('🧹 Cleaning old data...');
  const tables = ['payments', 'appointment_services', 'appointments', 'clients'];
  for (const table of tables) {
    console.log(`- Deleting from ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition
    if (error) {
      console.error(`Error cleaning ${table}:`, error.message);
      throw error;
    }
  }
  console.log('✅ Data cleaned.');
}

async function seedData() {
  console.log('🌱 Seeding new data...');

  // Get existing staff and services
  const { data: staff } = await supabase.from('staff').select('id, name');
  const { data: services } = await supabase.from('services').select('id, name, duration_min, price');

  if (!staff || staff.length === 0 || !services || services.length === 0) {
    console.error('Staff or services not found. Please seed them first.');
    return;
  }

  // 1. Create clients
  console.log('- Creating clients...');
  const clientsToCreate = [
    { name: 'Lucia Reyes', phone: '987654321', status: 'activa' },
    { name: 'Mariana Acosta', phone: '912345678', status: 'activa' },
    { name: 'Valeria Luna', phone: '998877665', status: 'inactiva' },
    { name: 'Camila Solis', phone: '955443322', status: 'prospecto' },
    { name: 'Renata Flores', phone: '933221100', status: 'vip' },
    { name: 'Isabella Rios', phone: '944556677', status: 'activa' },
    { name: 'Sofia Navarro', phone: '966778899', status: 'prospecto' },
    { name: 'Daniela Paredes', phone: '922113344', status: 'activa' },
  ];
  const { data: clients } = await supabase.from('clients').insert(clientsToCreate).select();
  console.log(`✅ ${clients.length} clients created.`);

  // 2. Create appointments and related payments
  console.log('- Creating appointments and payments...');
  let appointmentsCreated = 0;
  let paymentsCreated = 0;

  for (const client of clients) {
    const status = getRandomItem(['programada', 'completada', 'cancelada']);
    const appointmentServices = [getRandomItem(services)];
    if (Math.random() > 0.5) {
      appointmentServices.push(getRandomItem(services.filter(s => s.id !== appointmentServices[0].id)));
    }
    const total_duration_min = appointmentServices.reduce((sum, s) => sum + s.duration_min, 0);
    const total_price = appointmentServices.reduce((sum, s) => sum + s.price, 0);

    const startTime = status === 'completada' ? getRandomTime(DATES.yesterday) : getRandomTime(DATES.tomorrow);
    const endTime = new Date(new Date(startTime).getTime() + total_duration_min * 60000).toISOString();
    
    const { data: appt } = await supabase.from('appointments').insert({
      client_id: client.id,
      artist_id: getRandomItem(staff).id,
      title: appointmentServices.map(s => s.name).join(', '),
      start_time: startTime,
      end_time: endTime,
      status,
      total_price,
      total_duration_min,
    }).select().single();

    if (appt) {
      appointmentsCreated++;
      const servicesToInsert = appointmentServices.map(s => ({
        appointment_id: appt.id,
        service_id: s.id,
        artist_id: getRandomItem(staff).id,
        service_price: s.price,
      }));
      await supabase.from('appointment_services').insert(servicesToInsert);

      // Create reservation payment
      await supabase.from('payments').insert({
        concept: `Reserva cita ${client.name}`,
        amount: 20,
        type: 'ingreso',
        category: 'servicio',
        payment_kind: 'reserva',
        payment_method: 'yape_plin',
        appointment_id: appt.id,
        client_id: client.id,
        date: new Date(new Date(startTime).setDate(new Date(startTime).getDate() - 1)).toISOString().split('T')[0],
      });
      paymentsCreated++;
      
      if (status === 'completada') {
        await supabase.from('payments').insert({
          concept: `Pago final ${client.name}`,
          amount: total_price - 20,
          type: 'ingreso',
          category: 'servicio',
          payment_kind: 'pago_final',
          payment_method: 'efectivo',
          appointment_id: appt.id,
          client_id: client.id,
          date: new Date(startTime).toISOString().split('T')[0],
        });
        paymentsCreated++;
      }
    }
  }
  console.log(`✅ ${appointmentsCreated} appointments and ${paymentsCreated} payments created.`);
  
  // 3. Create some expenses
  console.log('- Creating expenses...');
  const expenses = [
    { concept: 'Insumos para uñas', amount: 150, type: 'egreso', category: 'insumo', date: DATES.yesterday.toISOString().split('T')[0] },
    { concept: 'Alquiler de local', amount: 1000, type: 'egreso', category: 'alquiler', date: new Date(new Date().setDate(1)).toISOString().split('T')[0] },
    { concept: 'Publicidad en Instagram', amount: 80, type: 'egreso', category: 'marketing', date: new Date(new Date().setDate(5)).toISOString().split('T')[0] },
  ];
  await supabase.from('payments').insert(expenses);
  console.log(`✅ ${expenses.length} expenses created.`);
}


async function main() {
  try {
    await cleanData();
    await seedData();
    console.log('\n🎉 Database seeded successfully!');
  } catch (error) {
    console.error('\n❌ An error occurred during seeding:');
    console.error(error);
    process.exit(1);
  }
}

main();
