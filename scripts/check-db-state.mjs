import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aldbomizedsoxyluvgog.supabase.co',
  'sb_publishable_yGke61hjFiMk6Hjw6vHMeQ_5qdcpajm'
);

async function checkDatabaseState() {
  console.log('=== Verificando estado de la BD ===\n');
  
  // Verificar cada tabla
  const tablesToCheck = [
    'clients', 'services', 'staff', 'appointments', 'payments',
    'roles', 'categories', 'staff_specialties'
  ];
  
  for (const table of tablesToCheck) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    const exists = !error || error.code !== '42P01';
    const status = exists ? `✅ EXISTE (count: ${count || 0})` : '❌ NO EXISTE';
    console.log(`${table.padEnd(20)} ${status}`);
    if (error && error.code !== '42P01') {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n=== Enums existentes ===');
  // No podemos ver enums directamente, pero podemos inferir
  
  console.log('\n=== Listado de tablas via query ===');
  const { data: servicesData, error: svcError } = await supabase
    .from('services')
    .select('*')
    .limit(3);
  
  if (!svcError && servicesData) {
    console.log('Services columns:', Object.keys(servicesData[0] || {}));
    console.log('Sample:', servicesData[0] || 'empty');
  } else if (svcError) {
    console.log('Error services:', svcError.message);
  }
  
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .limit(3);
  
  if (!staffError && staffData) {
    console.log('\nStaff columns:', Object.keys(staffData[0] || {}));
    console.log('Sample:', staffData[0] || 'empty');
  }
}

checkDatabaseState();
