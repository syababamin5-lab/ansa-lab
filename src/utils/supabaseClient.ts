import { createClient } from '@supabase/supabase-js';

// Supabase Cloud Project Configuration (ANSA LIMS Cloud Database Engine)
const SUPABASE_URL = 'https://vyvyxxtvymymygvymvym.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dnl4eHR2eW15bXlndnltdnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzc2MDAsImV4cCI6MjA1NTc1MzYwMH0.ansa_lab_lims_cloud_production_key_token';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Helper cek koneksi ke Cloud Database */
export async function checkCloudConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('ansa_lab_health').select('count').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}
