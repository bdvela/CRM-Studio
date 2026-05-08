#!/usr/bin/env node
// Usage: node scripts/clean-db.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = ['payments', 'appointment_services', 'appointments', 'clients', 'services', 'staff'];

async function clean() {
  console.log('⚠️  This will DELETE ALL DATA from your Supabase database.\n');

  for (const table of TABLES) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error(`❌ Failed to clean ${table}:`, error.message);
      process.exit(1);
    }
    console.log(`✅ Cleaned ${table}`);
  }

  console.log('\n✅ Database cleaned successfully!');
}

clean();
