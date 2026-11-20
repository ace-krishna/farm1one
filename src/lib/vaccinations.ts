import type { Animal } from './animals';
import { VACCINE_RULES } from './vaccineRules';

// ---------------------------------------------------------------------------
// Vaccination schedule engine.
// Reads src/lib/vaccineRules.js (the only source of vaccines and ages) and each
// animal's date of birth, and works out the NEXT pending dose of every rule.
// Nothing here is saved yet: "records" is whatever the screen passes in.
// ---------------------------------------------------------------------------

interface RuleDose {
  label: string;
  atAgeDays?: number;
  afterPrevDays?: number;
  optional?: boolean;
}

interface Rule {
  id: string;
  species: string[];
  name: string;
  doses: RuleDose[];
  repeatEveryDays?: number;
  once?: boolean;
  season?: string;
  sex?: string;
  crossbredOnly?: boolean;
  birdType?: string[];
  active?: boolean;
  auto?: boolean;
  eventBased?: boolean;
  riskBased?: boolean;
  optional?: boolean;
}

const RULES = VACCINE_RULES as unknown as Rule[];

export type VaccineTag = 'age-based' | 'booster' | 'recurring' | 'one-time' | 'season-based';
export type Group = 'overdue' | 'week' | 'later';

/** One saved action on one dose. Key = `${animalId}|${ruleId}|${stepIndex}`. */
export interface DoseRecord {
  givenOn?: string; // YYYY-MM-DD
  dueOn?: string; // YYYY-MM-DD (rescheduled due date, this dose only)
}
export type DoseRecords = Record<string, DoseRecord>;

export interface DueItem {
  key: string;
  animal: Animal;
  ruleId: string;
  doseIndex: number;
  ruleName: string;
  doseLabel: string;
  tags: VaccineTag[];
  due: Date;
  group: Group;
  /** Days from today: negative = overdue. */
  daysFromToday: number;
}

// ---------- date helpers (local dates, no time-zone surprises) ----------

const pad = (n: number) => String(n).padStart(2, '0');
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
export const daysBetween = (from: Date, to: Date) => dayNumber(to) - dayNumber(from);

export const WEEK_DAYS = 7; // "this week" = today + the next 6 days
export const LATER_DAYS = 30; // "later" = up to 30 days from today

// ---------- which rules apply to which animal ----------

function ruleApplies(rule: Rule, animal: Animal): boolean {
  if (animal.species === 'goat') return false; // goat schedule: waiting for vet-verified data
  if (rule.active === false || rule.auto === false || rule.eventBased) return false; // IBR hidden, rabies never scheduled
  if (rule.riskBased || rule.optional) return false;
  if (!rule.species.includes(animal.species)) return false;
  if (rule.sex && rule.sex !== animal.sex) return false;
  if (rule.crossbredOnly && !(animal.species === 'cow' && animal.breed === 'crossbred')) return false;
  if (rule.birdType && !rule.birdType.includes(animal.hen_purpose ?? '')) return false;
  return true;
}

function groupOf(daysFromToday: number): Group | null {
  if (daysFromToday < 0) return 'overdue';
  if (daysFromToday < WEEK_DAYS) return 'week';
  if (daysFromToday <= LATER_DAYS) return 'later';
  return null; // further away than 30 days: not shown yet
}

interface PendingStep {
  index: number;
  label: string;
  tags: VaccineTag[];
  scheduled: Date;
  due: Date;
}

/** Walks a rule's dose chain and returns the first dose that has not been given yet. */
function firstPendingStep(animal: Animal, rule: Rule, records: DoseRecords): PendingStep | null {
  if (!ruleApplies(rule, animal)) return null;
  const dob = parseISODate(animal.dob);
  let prevGiven: Date | null = null;

  for (let i = 0; i < 80; i++) {
    let label: string;
    let atAgeDays: number | undefined;
    let afterPrevDays: number | undefined;
    const tags: VaccineTag[] = [];

    if (i < rule.doses.length) {
      const dose = rule.doses[i];
      if (dose.optional) return null; // "if indicated" doses are not scheduled
      label = dose.label;
      atAgeDays = dose.atAgeDays;
      afterPrevDays = dose.afterPrevDays;
      tags.push(dose.atAgeDays != null ? 'age-based' : 'booster');
      if (/booster/i.test(dose.label) && !tags.includes('booster')) tags.push('booster');
    } else if (rule.repeatEveryDays && !rule.once) {
      label = 'Repeat';
      afterPrevDays = rule.repeatEveryDays;
      tags.push('recurring');
    } else {
      return null; // all doses done and the rule does not repeat
    }
    if (rule.once) tags.push('one-time');
    if (rule.season) tags.push('season-based');

    const rec = records[`${animal.id}|${rule.id}|${i}`];
    if (rec?.givenOn) {
      // The next dose is counted from the date this one was actually given.
      prevGiven = parseISODate(rec.givenOn);
      continue;
    }

    let scheduled: Date;
    if (atAgeDays != null) scheduled = addDays(dob, atAgeDays);
    else if (afterPrevDays != null && prevGiven) scheduled = addDays(prevGiven, afterPrevDays);
    else return null;

    return { index: i, label, tags, scheduled, due: rec?.dueOn ? parseISODate(rec.dueOn) : scheduled };
  }
  return null;
}

/** All pending doses that are overdue, due this week, or due in the next 30 days. */
export function buildDueItems(animals: Animal[], records: DoseRecords, today: Date): DueItem[] {
  const items: DueItem[] = [];
  for (const animal of animals) {
    for (const rule of RULES) {
      const step = firstPendingStep(animal, rule, records);
      if (!step) continue;
      const daysFromToday = daysBetween(today, step.due);
      const group = groupOf(daysFromToday);
      if (!group) continue;
      items.push({
        key: `${animal.id}|${rule.id}|${step.index}`,
        animal,
        ruleId: rule.id,
        doseIndex: step.index,
        ruleName: rule.name,
        doseLabel: step.label,
        tags: step.tags,
        due: step.due,
        group,
        daysFromToday,
      });
    }
  }
  return items.sort((a, b) => a.due.getTime() - b.due.getTime() || (a.animal.name ?? '').localeCompare(b.animal.name ?? ''));
}

/** The next dose of one rule for one animal (any distance away). Used for the "next dose" message. */
export function nextDoseFor(animal: Animal, ruleId: string, records: DoseRecords): { label: string; due: Date } | null {
  const rule = RULES.find((r) => r.id === ruleId);
  if (!rule) return null;
  const step = firstPendingStep(animal, rule, records);
  return step ? { label: step.label, due: step.due } : null;
}

/** The category tags (age-based, booster, ...) of one dose of a rule. Used to filter the Done list. */
export function tagsForDose(ruleId: string, doseIndex: number): VaccineTag[] {
  const rule = RULES.find((r) => r.id === ruleId);
  if (!rule) return [];
  const tags: VaccineTag[] = [];
  if (doseIndex < rule.doses.length) {
    const dose = rule.doses[doseIndex];
    tags.push(dose.atAgeDays != null ? 'age-based' : 'booster');
    if (/booster/i.test(dose.label) && !tags.includes('booster')) tags.push('booster');
  } else {
    tags.push('recurring');
  }
  if (rule.once) tags.push('one-time');
  if (rule.season) tags.push('season-based');
  return tags;
}
