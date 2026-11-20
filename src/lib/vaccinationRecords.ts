import { supabase, isSupabaseConfigured } from './supabase';
import { SetupError } from './animals';

/** One dose that was marked as done. Saved in the Supabase "vaccinations" table. */
export interface VaccinationRecord {
  id: string;
  animal_id: string;
  owner_id: string | null;
  rule_id: string;
  dose_index: number;
  rule_name: string;
  dose_label: string;
  given_on: string; // YYYY-MM-DD
  created_at: string;
}

export type NewVaccinationRecord = Pick<VaccinationRecord, 'animal_id' | 'rule_id' | 'dose_index' | 'rule_name' | 'dose_label' | 'given_on'>;

const CACHE_KEY = 'farmone.vaccinations.v1';

// ---------- Local cache (so the Done list still shows offline) ----------

export function getCachedRecords(): VaccinationRecord[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as VaccinationRecord[]) : [];
  } catch {
    return [];
  }
}

function setCachedRecords(list: VaccinationRecord[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* cache is optional */
  }
}

// ---------- Supabase ----------

export async function fetchRecords(): Promise<VaccinationRecord[]> {
  if (!isSupabaseConfigured) throw new SetupError('Supabase is not set up yet.');
  const { data, error } = await supabase.from('vaccinations').select('*').order('given_on', { ascending: false });
  if (error) throw error;
  setCachedRecords(data as VaccinationRecord[]);
  return data as VaccinationRecord[];
}

export async function saveRecord(record: NewVaccinationRecord): Promise<VaccinationRecord> {
  if (!isSupabaseConfigured) throw new SetupError('Supabase is not set up yet.');
  const { data, error } = await supabase.from('vaccinations').insert(record).select().single();
  if (error) throw error;
  setCachedRecords([data as VaccinationRecord, ...getCachedRecords().filter((r) => r.id !== data.id)]);
  return data as VaccinationRecord;
}

export async function deleteRecord(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new SetupError('Supabase is not set up yet.');
  const { error } = await supabase.from('vaccinations').delete().eq('id', id);
  if (error) throw error;
  setCachedRecords(getCachedRecords().filter((r) => r.id !== id));
}
