import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aldbomizedsoxyluvgog.supabase.co',
  'sb_publishable_yGke61hjFiMk6Hjw6vHMeQ_5qdcpajm'
);

async function checkTableStructure() {
  console.log('=== Verificando estructura detallada ===\n');
  
  // Intentar inspeccionar las columnas intentando insertar y ver errores
  // O mejor: intentar diferentes consultas
  
  console.log('=== Intentando verificar columna category en services ===');
  
  // Intentar select con columnas específicas
  try {
    const { error: e1 } = await supabase.from('services').select('category_id');
    console.log('services.category_id:', e1 ? `❌ No existe (${e1.message})` : '✅ Sí existe');
  } catch (e) {}
  
  try {
    const { error: e2 } = await supabase.from('services').select('category');
    console.log('services.category:', e2 ? `❌ No existe (${e2.message})` : '✅ Sí existe');
  } catch (e) {}
  
  console.log('\n=== Intentando verificar columna specialties en staff ===');
  
  try {
    const { error: e3 } = await supabase.from('staff').select('specialties');
    console.log('staff.specialties:', e3 ? `❌ No existe (${e3.message})` : '✅ Sí existe');
  } catch (e) {}
  
  try {
    const { error: e4 } = await supabase.from('staff').select('role_id');
    console.log('staff.role_id:', e4 ? `❌ No existe (${e4.message})` : '✅ Sí existe');
  } catch (e) {}
  
  console.log('\n=== Verificando categories ===');
  const { data: cats } = await supabase.from('categories').select('*');
  console.log('Categories count:', cats?.length || 0);
  if (cats && cats.length > 0) {
    console.log('Categories:', cats.map(c => c.name));
  }
  
  console.log('\n=== Verificando roles ===');
  const { data: roles } = await supabase.from('roles').select('*');
  console.log('Roles:', roles?.map(r => r.name) || []);
}

checkTableStructure();
