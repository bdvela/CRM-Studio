import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://aldbomizedsoxyluvgog.supabase.co', 'sb_publishable_yGke61hjFiMk6Hjw6vHMeQ_5qdcpajm');

const { data: clients, error } = await supabase.from('clients').select('*');
console.log('=== Clients ===');
console.log('Count:', clients?.length);
console.log('Error:', JSON.stringify(error));
if (clients && clients.length > 0) console.log('First:', clients[0]);

const { data: appts, error: e3 } = await supabase.from('appointments').select('*');
console.log('\n=== Appointments ===');
console.log('Count:', appts?.length);
console.log('Error:', JSON.stringify(e3));
