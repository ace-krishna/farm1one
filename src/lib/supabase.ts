import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT-ID') && !key.includes('YOUR-ANON'));

// A dummy URL is used when .env is not filled in yet, so the app still starts.
// Only the base address is used, so a pasted ".../rest/v1" ending is harmless.
const baseUrl = isSupabaseConfigured ? new URL(url!.trim()).origin : 'https://placeholder.supabase.co';

export const supabase = createClient(
  baseUrl,
  isSupabaseConfigured ? key!.trim() : 'placeholder-key',
);
