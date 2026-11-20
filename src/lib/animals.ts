import { supabase, isSupabaseConfigured } from './supabase';

export type Species = 'cow' | 'buffalo' | 'goat' | 'hen';
export type Sex = 'male' | 'female';

export interface Animal {
  id: string;
  owner_id: string | null;
  name: string | null;
  ear_tag: string | null;
  species: Species;
  breed: string | null; // cow only
  coat_color: string;
  hen_purpose: string | null; // hen only
  dob: string; // YYYY-MM-DD
  sex: Sex;
  created_at: string;
}

export type NewAnimal = Omit<Animal, 'id' | 'owner_id' | 'created_at'>;

const CACHE_KEY = 'farmone.animals.v1';

// ---------- Date of birth ----------

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Hens: weeks + days ago. Everything else: years + months ago. Returns YYYY-MM-DD. */
export function dobFromApproxAge(species: Species, first: number, second: number, today = new Date()): string {
  if (species === 'hen') {
    return toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (first * 7 + second)));
  }
  const monthIndex = today.getMonth() - second;
  const year = today.getFullYear() - first;
  // Keep the same day of the month, but never spill into the next month (e.g. 31 Mar - 1 month = 28/29 Feb).
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return toISODate(new Date(year, monthIndex, Math.min(today.getDate(), lastDay)));
}

// ---------- Local cache (so animals still show offline) ----------

export function getCachedAnimals(): Animal[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Animal[]) : [];
  } catch {
    return [];
  }
}

function setCachedAnimals(list: Animal[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* cache is optional */
  }
}

// ---------- Supabase ----------

export class SetupError extends Error {}

export async function saveAnimal(animal: NewAnimal): Promise<Animal> {
  if (!isSupabaseConfigured) throw new SetupError('Supabase is not set up yet.');
  const { data, error } = await supabase.from('animals').insert(animal).select().single();
  if (error) throw error;
  setCachedAnimals([data as Animal, ...getCachedAnimals().filter((a) => a.id !== data.id)]);
  return data as Animal;
}

/** Loads animals from Supabase (newest first) and refreshes the local cache. */
export async function fetchAnimals(): Promise<Animal[]> {
  if (!isSupabaseConfigured) throw new SetupError('Supabase is not set up yet.');
  const { data, error } = await supabase.from('animals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  setCachedAnimals(data as Animal[]);
  return data as Animal[];
}
