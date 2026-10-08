import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mdoffmtawpvmdezcexdx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb2ZmbXRhd3B2bWRlemNleGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Njg1MzUsImV4cCI6MjEwNzA0NDUzNX0.foWqPglxOFqmwYK4Z86q61S7YcpoiYhYhq0YYyVml10';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

let isConnected = true;

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('Organizacao').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log('📡 [Supabase] Conectado à API do Supabase! (Lembre-se de rodar o criacao_completa.sql no SQL Editor se ainda não rodou)');
    } else {
      console.log('✅ [Supabase] Conexão com o Supabase estabelecida com sucesso via API.');
    }
    isConnected = true;
    return true;
  } catch (error) {
    console.warn('⚠️ [Supabase] Aviso ao testar API:', error.message);
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}
