import React, { useEffect, useMemo, useState } from 'react';
import { fetchAnimals, getCachedAnimals, SetupError, type Animal, type Species } from '../../lib/animals';
import {
  deleteRecord,
  fetchRecords,
  getCachedRecords,
  saveRecord,
  type VaccinationRecord,
} from '../../lib/vaccinationRecords';
import {
  addDays,
  buildDueItems,
  nextDoseFor,
  parseISODate,
  startOfDay,
  tagsForDose,
  toISODate,
  type DoseRecords,
  type DueItem,
  type Group,
  type VaccineTag,
} from '../../lib/vaccinations';

// Uniform scale for the whole screen (0.74 = 10% larger than the earlier 0.67).
const UI_SCALE = 0.74;

type SpeciesFilter = 'all' | Species;
type HenFilter = 'all' | 'broiler' | 'layer';
type TypeFilter = 'all' | VaccineTag;
type Mode = 'due' | 'done';
type SortOrder = 'newest' | 'oldest';

interface DoneItem {
  record: VaccinationRecord;
  animal: Animal;
  tags: VaccineTag[];
}

const SPECIES_CHIPS: { id: SpeciesFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cow', label: 'Cows' },
  { id: 'buffalo', label: 'Buffaloes' },
  { id: 'goat', label: 'Goats' },
  { id: 'hen', label: 'Hens' },
];

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All vaccinations' },
  { id: 'age-based', label: 'Age-based' },
  { id: 'booster', label: 'Booster' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'one-time', label: 'One-time' },
  { id: 'season-based', label: 'Season-based' },
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = (d: Date) => `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDayFull = (d: Date) => `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
const fmtGiven = (d: Date) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
const fmtDayComma = (d: Date) => `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;

const SPECIES_LABEL: Record<Species, string> = { cow: 'Cow', buffalo: 'Buffalo', goat: 'Goat', hen: 'Hen' };
const animalName = (a: Animal) => a.name || a.ear_tag || SPECIES_LABEL[a.species];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const timingText = (days: number) =>
  days < 0 ? `${plural(-days, 'day')} overdue` : days === 0 ? 'Due today' : `In ${plural(days, 'day')}`;

const GROUP_STYLE: Record<Group, { strip: string; avatarBg: string; avatarText: string; timing: string }> = {
  overdue: { strip: '#ba1a1a', avatarBg: '#ffdad6', avatarText: '#ba1a1a', timing: '#ba1a1a' },
  week: { strip: '#B26A00', avatarBg: '#f4ded1', avatarText: '#504238', timing: '#B26A00' },
  later: { strip: '#6B7468', avatarBg: '#e6e9e7', avatarText: '#6B7468', timing: '#6B7468' },
};

const Icon: React.FC<{ name: string; size?: number; fill?: boolean; className?: string; style?: React.CSSProperties }> = ({
  name,
  size = 20,
  fill,
  className = '',
  style,
}) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontSize: size, ...(fill ? { fontVariationSettings: '"FILL" 1' } : {}), ...style }}
  >
    {name}
  </span>
);

interface Props {
  onBack: () => void;
}

export const VaccinationScreen: React.FC<Props> = ({ onBack }) => {
  const [today] = useState(() => startOfDay(new Date()));
  const [animals, setAnimals] = useState<Animal[]>(getCachedAnimals);
  // Doses marked as done are saved in Supabase (cached for offline). Reschedules are kept only while this screen is open.
  const [givenRecords, setGivenRecords] = useState<VaccinationRecord[]>(getCachedRecords);
  const [dueOverrides, setDueOverrides] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>('due');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [doneSpecies, setDoneSpecies] = useState<SpeciesFilter>('all');
  const [doneFemaleOnly, setDoneFemaleOnly] = useState(false);
  const [doneHen, setDoneHen] = useState<HenFilter>('all');
  const [animalMenuOpen, setAnimalMenuOpen] = useState(false);

  const [savingKeys, setSavingKeys] = useState<string[]>([]); // doses being saved right now

  const [dayIndex, setDayIndex] = useState(0);
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [henFilter, setHenFilter] = useState<HenFilter>('all');
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const [rescheduleItem, setRescheduleItem] = useState<DueItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<{ date: Date; note: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnimals()
      .then((list) => {
        if (!cancelled) setAnimals(list);
      })
      .catch((err) => console.warn('Could not refresh animals (showing saved copy):', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRecords()
      .then((list) => {
        if (!cancelled) setGivenRecords(list);
      })
      .catch((err) => console.warn('Could not refresh vaccinations (showing saved copy):', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  // ---------- data: every pending dose, then the filters ----------
  const buildRecords = (given: VaccinationRecord[], overrides: Record<string, string>): DoseRecords => {
    const map: DoseRecords = {};
    for (const [key, dueOn] of Object.entries(overrides)) map[key] = { dueOn };
    for (const r of given) {
      const key = `${r.animal_id}|${r.rule_id}|${r.dose_index}`;
      map[key] = { ...map[key], givenOn: r.given_on };
    }
    return map;
  };
  const records = useMemo(() => buildRecords(givenRecords, dueOverrides), [givenRecords, dueOverrides]);
  const allItems = useMemo(() => buildDueItems(animals, records, today), [animals, records, today]);

  const allDone = useMemo<DoneItem[]>(() => {
    const byId = new Map(animals.map((a) => [a.id, a]));
    const list: DoneItem[] = [];
    for (const record of givenRecords) {
      const animal = byId.get(record.animal_id);
      if (animal) list.push({ record, animal, tags: tagsForDose(record.rule_id, record.dose_index) });
    }
    return list;
  }, [animals, givenRecords]);

  const matchesSpeciesFilters = (it: { animal: Animal }) => {
    const a = it.animal;
    if (speciesFilter !== 'all' && a.species !== speciesFilter) return false;
    if ((speciesFilter === 'cow' || speciesFilter === 'buffalo') && femaleOnly && a.sex !== 'female') return false;
    if (speciesFilter === 'hen' && henFilter !== 'all' && a.hen_purpose !== henFilter) return false;
    return true;
  };

  const speciesItems = allItems.filter(matchesSpeciesFilters);
  const items = speciesItems.filter((it) => typeFilter === 'all' || it.tags.includes(typeFilter));

  const doneSpeciesItems = allDone.filter(({ animal: a }) => {
    if (doneSpecies !== 'all' && a.species !== doneSpecies) return false;
    if ((doneSpecies === 'cow' || doneSpecies === 'buffalo') && doneFemaleOnly && a.sex !== 'female') return false;
    if (doneSpecies === 'hen' && doneHen !== 'all' && a.hen_purpose !== doneHen) return false;
    return true;
  });
  const doneItems = doneSpeciesItems
    .filter((it) => typeFilter === 'all' || it.tags.includes(typeFilter))
    .sort((a, b) => {
      const diff =
        a.record.given_on.localeCompare(b.record.given_on) || a.record.created_at.localeCompare(b.record.created_at);
      return sortOrder === 'newest' ? -diff : diff;
    });

  const countSource: { tags: VaccineTag[] }[] = mode === 'done' ? doneSpeciesItems : speciesItems;
  const typeCount = (id: TypeFilter) => (id === 'all' ? countSource.length : countSource.filter((it) => it.tags.includes(id)).length);

  const overdue = items.filter((i) => i.group === 'overdue');
  const week = items.filter((i) => i.group === 'week');
  const later = items.filter((i) => i.group === 'later');

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const dayCount = (i: number) => week.filter((it) => it.daysFromToday === i).length;
  const selectedDayItems = week.filter((it) => it.daysFromToday === dayIndex);

  // ---------- actions ----------
  const chooseSpecies = (id: SpeciesFilter) => {
    setSpeciesFilter(id);
    setFemaleOnly(false);
    setHenFilter('all');
  };

  // One tap on the tick saves the dose as given today (no pop-up). It then shows in the Done list.
  const markDone = async (it: DueItem) => {
    if (savingKeys.includes(it.key)) return;
    setSavingKeys((k) => [...k, it.key]);
    try {
      const saved = await saveRecord({
        animal_id: it.animal.id,
        rule_id: it.ruleId,
        dose_index: it.doseIndex,
        rule_name: it.ruleName,
        dose_label: it.doseLabel,
        given_on: toISODate(today),
      });
      const nextGiven = [saved, ...givenRecords.filter((r) => r.id !== saved.id)];
      setGivenRecords(nextGiven);
      const upcoming = nextDoseFor(it.animal, it.ruleId, buildRecords(nextGiven, dueOverrides));
      setToast(
        `${animalName(it.animal)}: ${it.ruleName} done` +
          (upcoming ? ` · Next: ${upcoming.label.toLowerCase()} on ${fmtDayComma(upcoming.due)}` : ''),
      );
    } catch (err) {
      console.error('Could not save vaccination:', err);
      setToast(
        err instanceof SetupError
          ? 'Saving is not set up yet. Check the Supabase keys in your .env file.'
          : 'Could not save. Check your internet and try again.',
      );
    } finally {
      setSavingKeys((k) => k.filter((x) => x !== it.key));
    }
  };

  const undoDone = async (d: DoneItem) => {
    try {
      await deleteRecord(d.record.id);
      setGivenRecords((list) => list.filter((r) => r.id !== d.record.id));
      setToast(`${animalName(d.animal)}: ${d.record.rule_name} moved back to the due list`);
    } catch (err) {
      console.error('Could not undo vaccination:', err);
      setToast('Could not undo. Check your internet and try again.');
    }
  };

  const openReschedule = (it: DueItem) => {
    setRescheduleItem(it);
    setRescheduleDate({ date: addDays(today, 1), note: 'Tomorrow' });
  };

  const confirmReschedule = () => {
    if (!rescheduleItem || !rescheduleDate) return;
    const it = rescheduleItem;
    setDueOverrides((o) => ({ ...o, [it.key]: toISODate(rescheduleDate.date) }));
    setToast(`${animalName(it.animal)}: ${it.ruleName} moved to ${fmtDayComma(rescheduleDate.date)}`);
    setRescheduleItem(null);
  };

  const rescheduleOptions = [
    { note: 'Tomorrow', label: 'Tomorrow', date: addDays(today, 1) },
    { note: 'In 3 Days', label: 'In 3 Days', date: addDays(today, 3) },
    { note: 'Next Week', label: 'Next Week', date: addDays(today, 7) },
  ];

  // ---------- small pieces ----------
  const Card: React.FC<{ it: DueItem }> = ({ it }) => {
    const st = GROUP_STYLE[it.group];
    return (
      <div className="relative w-full bg-white rounded-2xl px-3 py-4 shadow-sm overflow-hidden flex items-center justify-between">
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: st.strip }} />
        <div className="flex items-center gap-3 pl-1 min-w-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[17.5px] font-bold shrink-0"
            style={{ backgroundColor: st.avatarBg, color: st.avatarText }}
          >
            {animalName(it.animal).charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[16.5px] font-bold text-[#191c1b] truncate">{animalName(it.animal)}</h3>
            <p className="text-[14.5px] text-[#404945] font-medium truncate">{it.ruleName}</p>
            <span className="text-[11px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: st.timing }}>
              <Icon name="schedule" size={13} />
              {it.doseLabel} · {timingText(it.daysFromToday)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <button
            type="button"
            aria-label={`Reschedule ${animalName(it.animal)}`}
            onClick={() => openReschedule(it)}
            className="w-[42px] h-[42px] rounded-full bg-[#eceeec] hover:bg-[#e6e9e7] text-[#404945] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <Icon name="calendar_month" size={21} />
          </button>
          <button
            type="button"
            aria-label={`Mark ${animalName(it.animal)} ${it.ruleName} done`}
            onClick={() => markDone(it)}
            disabled={savingKeys.includes(it.key)}
            className="w-[42px] h-[42px] rounded-full bg-[#bde6d7] text-[#284e43] hover:bg-[#003629] hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Icon name="check" size={21} fill />
          </button>
        </div>
      </div>
    );
  };

  const DoneCard: React.FC<{ d: DoneItem }> = ({ d }) => (
    <div className="relative w-full bg-white rounded-2xl px-3 py-4 shadow-sm overflow-hidden flex items-center justify-between">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#7fb8de]" />
      <div className="flex items-center gap-3 pl-1 min-w-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-[17.5px] font-bold shrink-0 bg-[#dcedf9] text-[#1f5f8b]">
          {animalName(d.animal).charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-[16.5px] font-bold text-[#191c1b] truncate">{animalName(d.animal)}</h3>
          <p className="text-[14.5px] text-[#404945] font-medium truncate">{d.record.rule_name}</p>
          <span className="text-[11px] font-semibold mt-0.5 flex items-center gap-1 text-[#1f5f8b]">
            <Icon name="check_circle" size={13} fill />
            {d.record.dose_label} · Given {fmtGiven(parseISODate(d.record.given_on))}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label={`Undo ${animalName(d.animal)} ${d.record.rule_name}`}
        onClick={() => undoDone(d)}
        className="w-[42px] h-[42px] rounded-full bg-[#eceeec] hover:bg-[#e6e9e7] text-[#404945] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 ml-2"
      >
        <Icon name="undo" size={21} />
      </button>
    </div>
  );

  const EmptyCard: React.FC<{ icon: string; iconBg: string; iconColor: string; title: string; text: string }> = ({
    icon,
    iconBg,
    iconColor,
    title,
    text,
  }) => (
    <div className="w-full bg-white rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 border border-dashed border-[#c0c9c3]/60 shadow-sm">
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: iconBg, color: iconColor }}>
        <Icon name={icon} size={22} fill />
      </div>
      <p className="text-[16px] text-[#191c1b] font-bold">{title}</p>
      <p className="text-[12px] text-[#404945]">{text}</p>
    </div>
  );

  const SectionHeader: React.FC<{ color: string; title: string; badge: string; badgeBg: string; badgeColor: string }> = ({
    color,
    title,
    badge,
    badgeBg,
    badgeColor,
  }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-[16px] font-bold" style={{ color }}>
          {title}
        </h2>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: badgeBg, color: badgeColor }}>
        {badge}
      </span>
    </div>
  );

  const selectedType = TYPE_OPTIONS.find((o) => o.id === typeFilter)!;
  const activeSpecies = mode === 'done' ? doneSpecies : speciesFilter;
  const activeFemaleOnly = mode === 'done' ? doneFemaleOnly : femaleOnly;
  const activeHen = mode === 'done' ? doneHen : henFilter;
  const toggleFemaleOnly = () => (mode === 'done' ? setDoneFemaleOnly((v) => !v) : setFemaleOnly((v) => !v));
  const chooseHen = (id: HenFilter) => (mode === 'done' ? setDoneHen(id) : setHenFilter(id));
  const chooseDoneSpecies = (id: SpeciesFilter) => {
    setDoneSpecies(id);
    setDoneFemaleOnly(false);
    setDoneHen('all');
  };
  const showFemaleToggle = activeSpecies === 'cow' || activeSpecies === 'buffalo';
  const pillOn = 'bg-[#bce5d6] text-[#003629] font-bold shadow-sm';
  const pillOff = 'bg-white text-[#404945]';

  return (
    <div className="h-full w-full overflow-hidden bg-[#f8faf8]">
      <div
        className="flex flex-col relative overflow-hidden bg-[#f8faf8] text-[#191c1b] font-['Plus_Jakarta_Sans',sans-serif] antialiased"
        style={{ width: `${100 / UI_SCALE}%`, height: `${100 / UI_SCALE}%`, transform: `scale(${UI_SCALE})`, transformOrigin: 'top left' }}
      >
        {/* Header */}
        <header className="shrink-0 z-30 bg-[#f8faf8]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Go back"
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#003629] hover:bg-[#e6e9e7] transition-colors active:scale-95 cursor-pointer"
              >
                <Icon name="arrow_back" size={24} />
              </button>
              <h1 className="text-[18px] font-semibold text-[#003629] tracking-tight">Vaccination Schedule</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#bde6d7] flex items-center justify-center">
              <Icon name="vaccines" size={22} className="text-[#003629]" />
            </div>
          </div>
        </header>

        {/* Toast */}
        <div
          className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%] flex items-center gap-2 px-4 py-2 bg-[#003629] text-white rounded-full shadow-lg transition-all duration-300 pointer-events-none ${
            toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'
          }`}
        >
          <Icon name="check_circle" size={18} fill className="text-[#baeed9] shrink-0" />
          <span className="text-[11px] font-bold">{toast}</span>
        </div>

        <main className="flex-1 overflow-y-auto pb-8 scrollbar-none">
          {/* Date header */}
          <div className="px-4 pt-1 pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#40665a] uppercase tracking-wider block font-semibold">Livestock Health Docket</span>
              <p className="text-[16px] text-[#191c1b] font-bold">{fmtDayFull(days[dayIndex])}</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-[#bde6d7] text-[#003629]">
              {dayIndex === 0 ? 'Today' : dayIndex === 1 ? 'Tomorrow' : `In ${dayIndex} days`}
            </span>
          </div>

          {/* 7-day strip */}
          <div className="w-full overflow-x-auto px-4 py-1 scrollbar-none">
            <div className="flex items-center gap-1 min-w-max">
              {days.map((d, i) => {
                const active = i === dayIndex;
                const count = dayCount(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDayIndex(i)}
                    className={`flex flex-col items-center justify-center w-[58px] h-[77px] rounded-2xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${
                      active ? 'bg-[#bce5d6] text-[#003629]' : 'bg-white text-[#191c1b] hover:bg-[#e6e9e7]'
                    }`}
                    style={active ? { boxShadow: '0 4px 12px -2px rgba(188,229,214,0.45)' } : undefined}
                  >
                    <span className={`text-[12px] font-semibold uppercase tracking-wider ${active ? 'text-[#004d3b] font-bold' : 'text-[#707974]'}`}>
                      {WEEKDAY_SHORT[d.getDay()]}
                    </span>
                    <span className="text-[19px] font-bold mt-0.5">{d.getDate()}</span>
                    <div className="flex items-center justify-center gap-0.5 mt-1 h-[17px]">
                      {count > 0 && active && <span className="w-[7px] h-[7px] rounded-full bg-[#003629]" />}
                      {count > 0 && !active && (
                        <>
                          <span className="w-[7px] h-[7px] rounded-full bg-[#B26A00]" />
                          <span className="text-[11px] text-[#B26A00] font-bold">{count}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counters */}
          <div className="px-4 mt-3">
            <div className="w-full bg-white rounded-2xl p-2 shadow-sm flex items-center justify-between gap-1">
              <div className="flex-1 flex items-center justify-center gap-1 py-2 px-1 bg-[#ffdad6]/40 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                <span className="text-[11px] text-[#ba1a1a] font-bold tracking-tight">{overdue.length} overdue</span>
              </div>
              <div className="flex-1 flex items-center justify-center gap-1 py-2 px-1 bg-[#f4ded1]/40 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B26A00]" />
                <span className="text-[11px] text-[#B26A00] font-bold tracking-tight">{week.length} this week</span>
              </div>
              <div className="flex-1 flex items-center justify-center gap-1 py-2 px-1 bg-[#e6e9e7]/60 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B7468]" />
                <span className="text-[11px] text-[#6B7468] font-bold tracking-tight">{later.length} later</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 mt-3 flex flex-col gap-2">
            <div className="w-full overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1 min-w-max py-0.5">
                {SPECIES_CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setMode('due');
                      chooseSpecies(c.id);
                    }}
                    className={`px-[16px] py-[7.7px] rounded-full text-[14.3px] transition-transform active:scale-95 cursor-pointer ${mode === 'due' && speciesFilter === c.id ? pillOn : `${pillOff} font-bold`}`}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMode('done')}
                  className={`px-[16px] py-[7.7px] rounded-full text-[14.3px] transition-transform active:scale-95 cursor-pointer ${
                    mode === 'done' ? 'bg-[#cfe8fb] text-[#0a3d62] font-bold shadow-sm' : `${pillOff} font-bold`
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Vaccination type dropdown */}
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setTypeMenuOpen((o) => !o)}
                className="w-full bg-white flex items-center justify-between px-[14.5px] py-3 rounded-full shadow-sm hover:bg-[#f2f4f2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon name="filter_list" size={21} className="text-[#003629]" />
                  <span className="text-[15.5px] font-semibold">{selectedType.label}</span>
                </div>
                <Icon name="arrow_drop_down" size={24} className="text-[#707974]" />
              </button>
              {typeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setTypeMenuOpen(false)} />
                  <div className="absolute left-0 right-0 top-12 mt-1 z-30 bg-white rounded-2xl shadow-xl p-1 flex flex-col gap-1">
                    {TYPE_OPTIONS.map((o) => {
                      const on = typeFilter === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setTypeFilter(o.id);
                            setTypeMenuOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded-xl hover:bg-[#eceeec] text-[13px] flex items-center justify-between cursor-pointer ${
                            on ? 'text-[#191c1b]' : 'text-[#404945]'
                          }`}
                        >
                          <span>{o.label}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[12px] ${on ? 'bg-[#bde6d7] text-[#003629]' : 'bg-[#eceeec] text-[#404945]'}`}
                            >
                              {typeCount(o.id)}
                            </span>
                            {on && <Icon name="check" size={16} className="text-[#003629]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Done view: animal dropdown + sort order, all on one line */}
            {mode === 'done' && (
              <div className="relative flex items-center gap-1 w-full flex-nowrap">
                <button
                  type="button"
                  onClick={() => setAnimalMenuOpen((o) => !o)}
                  className="flex-1 min-w-0 bg-white flex items-center justify-between gap-1 pl-[14.5px] pr-2 py-[8.5px] rounded-full border border-[#c0c9c3]/60 shadow-sm hover:bg-[#f2f4f2] transition-colors cursor-pointer"
                >
                  <span className="text-[14.3px] font-bold text-[#404945] truncate">
                    {doneSpecies === 'all' ? 'All animals' : SPECIES_CHIPS.find((c) => c.id === doneSpecies)!.label}
                  </span>
                  <Icon name="arrow_drop_down" size={22} className="text-[#707974] shrink-0" />
                </button>
                {([
                  { id: 'newest', label: 'Newest first' },
                  { id: 'oldest', label: 'Oldest first' },
                ] as { id: SortOrder; label: string }[]).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSortOrder(o.id)}
                    className={`shrink-0 whitespace-nowrap px-[12px] py-[8.5px] rounded-full border text-[13px] transition-all shadow-sm cursor-pointer active:scale-95 ${
                      sortOrder === o.id ? `${pillOn} border-transparent` : `${pillOff} font-bold border-[#c0c9c3]/60 hover:bg-[#eceeec]`
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
                {animalMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setAnimalMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-30 w-[60%] bg-white rounded-2xl shadow-xl p-1 flex flex-col gap-1">
                      {SPECIES_CHIPS.map((c) => {
                        const on = doneSpecies === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              chooseDoneSpecies(c.id);
                              setAnimalMenuOpen(false);
                            }}
                            className={`text-left px-3 py-[9px] rounded-xl hover:bg-[#eceeec] text-[14.3px] flex items-center justify-between gap-2 cursor-pointer ${
                              on ? 'text-[#191c1b] font-bold' : 'text-[#404945]'
                            }`}
                          >
                            <span className="truncate">{c.id === 'all' ? 'All animals' : c.label}</span>
                            {on && <Icon name="check" size={16} className="text-[#003629] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Female only (cows and buffaloes) */}
            {showFemaleToggle && (
              <button
                type="button"
                aria-pressed={activeFemaleOnly}
                onClick={toggleFemaleOnly}
                className={`flex items-center gap-[7px] px-[14.5px] py-[7px] rounded-full border text-[13px] transition-all self-start shadow-sm cursor-pointer active:scale-95 ${
                  activeFemaleOnly
                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a] font-bold'
                    : 'bg-white text-[#404945] border-[#c0c9c3]/60 font-bold hover:bg-[#eceeec]'
                }`}
              >
                <Icon name={activeFemaleOnly ? 'check_circle' : 'female'} size={19} />
                <span>Female Only💉🎀</span>
              </button>
            )}

            {/* Hen sub-filter */}
            {activeSpecies === 'hen' && (
              <div className="flex items-center gap-1 self-start flex-wrap">
                {([
                  { id: 'all', label: 'All Hens' },
                  { id: 'broiler', label: 'Broiler 🐔' },
                  { id: 'layer', label: 'Layer 🐣' },
                ] as { id: HenFilter; label: string }[]).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => chooseHen(p.id)}
                    className={`px-[14.5px] py-[7px] rounded-full border text-[13px] transition-all shadow-sm cursor-pointer active:scale-95 ${
                      activeHen === p.id ? `${pillOn} border-transparent` : `${pillOff} font-bold border-[#c0c9c3]/60 hover:bg-[#eceeec]`
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Lists ---------- */}
          {mode === 'done' ? (
            <div className="px-4 mt-4">
              <div className="flex flex-col gap-2">
                {doneItems.length === 0 ? (
                  <EmptyCard
                    icon="task_alt"
                    iconBg="#dcedf9"
                    iconColor="#1f5f8b"
                    title="No completed vaccinations"
                    text="Doses you mark as done will appear here."
                  />
                ) : (
                  doneItems.map((d) => <DoneCard key={d.record.id} d={d} />)
                )}
              </div>
            </div>
          ) : speciesFilter === 'goat' ? (
            <div className="px-4 mt-6">
              <EmptyCard
                icon="hourglass_top"
                iconBg="#e6e9e7"
                iconColor="#6B7468"
                title="Vaccine schedule coming soon"
                text="Goat vaccine schedules will be added after verification by a vet."
              />
            </div>
          ) : animals.length === 0 ? (
            <div className="px-4 mt-6">
              <EmptyCard
                icon="pets"
                iconBg="#bde6d7"
                iconColor="#003629"
                title="No animals registered yet"
                text="Register an animal to see its vaccination schedule."
              />
            </div>
          ) : dayIndex === 0 ? (
            <>
              <div className="px-4 mt-6">
                <SectionHeader color="#ba1a1a" title="Overdue" badge="Requires Action" badgeBg="#ffdad6" badgeColor="#ba1a1a" />
                <div className="flex flex-col gap-2">
                  {overdue.length === 0 ? (
                    <EmptyCard icon="task_alt" iconBg="#bde6d7" iconColor="#003629" title="All caught up!" text="No overdue vaccinations. All records are up to date." />
                  ) : (
                    overdue.map((it) => <Card key={it.key} it={it} />)
                  )}
                </div>
              </div>
              <div className="px-4 mt-6">
                <SectionHeader color="#B26A00" title="This week" badge="Priority Schedule" badgeBg="#f4ded1" badgeColor="#504238" />
                <div className="flex flex-col gap-2">
                  {week.length === 0 ? (
                    <EmptyCard
                      icon="event_available"
                      iconBg="#f4ded1"
                      iconColor="#504238"
                      title="No vaccinations this week"
                      text="All upcoming doses scheduled for this week are completed."
                    />
                  ) : (
                    week.map((it) => <Card key={it.key} it={it} />)
                  )}
                </div>
              </div>
              <div className="px-4 mt-6">
                <SectionHeader color="#6B7468" title="Later (Next 30 days)" badge="Planned Routine" badgeBg="#e6e9e7" badgeColor="#404945" />
                <div className="flex flex-col gap-2">
                  {later.length === 0 ? (
                    <EmptyCard
                      icon="verified"
                      iconBg="#e6e9e7"
                      iconColor="#6B7468"
                      title="All planned routines clear"
                      text="No remaining routine doses for this period."
                    />
                  ) : (
                    later.map((it) => <Card key={it.key} it={it} />)
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 mt-6">
              <SectionHeader color="#B26A00" title={fmtDay(days[dayIndex])} badge="Priority Schedule" badgeBg="#f4ded1" badgeColor="#504238" />
              <div className="flex flex-col gap-2">
                {selectedDayItems.length === 0 ? (
                  <div className="w-full bg-white rounded-2xl p-6 text-center flex flex-col items-center gap-2 border border-dashed border-[#c0c9c3]/70 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-[#bde6d7] flex items-center justify-center text-[#003629] mb-1">
                      <Icon name="nature_people" size={28} fill />
                    </div>
                    <h3 className="text-[16px] font-bold">No vaccinations scheduled for {fmtDay(days[dayIndex])}</h3>
                    <p className="text-[13px] text-[#404945] max-w-xs">All livestock are clear of due dates for this day.</p>
                    <button
                      type="button"
                      onClick={() => setDayIndex(0)}
                      className="mt-2 px-3 py-2 rounded-full bg-[#eceeec] text-[#003629] text-[11px] font-bold hover:bg-[#e6e9e7] transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="calendar_today" size={16} />
                      <span>Back to Today ({fmtDay(days[0])})</span>
                    </button>
                  </div>
                ) : (
                  selectedDayItems.map((it) => <Card key={it.key} it={it} />)
                )}
              </div>
            </div>
          )}
        </main>

        {/* Reschedule dialog */}
        {rescheduleItem && rescheduleDate && (
          <div
            className="absolute inset-0 z-40 bg-[#2e3130]/40 backdrop-blur-xs flex items-center justify-center p-3"
            onClick={() => setRescheduleItem(null)}
          >
            <div className="bg-white w-full rounded-3xl p-4 max-h-[85%] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-[#e1e3e1] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold">Reschedule Dose</h3>
                  <p className="leading-snug">
                    <span className="text-[18.7px] text-[#191c1b] font-bold">{animalName(rescheduleItem.animal)}</span>
                    <span className="text-[12.5px] text-[#707974] font-medium ml-2">{rescheduleItem.ruleName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setRescheduleItem(null)}
                  className="w-10 h-10 rounded-full bg-[#eceeec] hover:bg-[#e6e9e7] flex items-center justify-center text-[#404945] cursor-pointer shrink-0"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-[10px] text-[#707974] uppercase tracking-wider font-semibold">Suggested Dates</label>
                <div className="grid grid-cols-3 gap-1">
                  {rescheduleOptions.map((o) => {
                    const on = rescheduleDate.note === o.note;
                    return (
                      <button
                        key={o.note}
                        type="button"
                        onClick={() => setRescheduleDate({ date: o.date, note: o.note })}
                        className={`py-[9px] px-1 rounded-xl text-[12px] font-bold transition-all text-center border cursor-pointer ${
                          on ? 'bg-[#bce5d6] text-[#003629] border-[#003629]/20' : 'bg-[#f2f4f2] text-[#191c1b] border-transparent hover:bg-[#bde6d7]'
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1">
                  <label className="text-[10px] text-[#707974] uppercase tracking-wider font-semibold block mb-1">Or Pick Custom Date</label>
                  <div className="relative w-full flex items-center justify-between px-[14px] py-[11px] rounded-full bg-[#f2f4f2] border border-[#c0c9c3]/60 hover:border-[#003629] transition-all">
                    <div className="flex items-center gap-2 pointer-events-none">
                      <Icon name="calendar_today" size={20} className="text-[#003629]" />
                      <span className="text-[12px] font-medium">
                        {rescheduleDate.note === 'Custom' ? fmtDayComma(rescheduleDate.date) : 'Select Custom Date'}
                      </span>
                    </div>
                    <Icon name="edit_calendar" size={18} className="text-[#707974] pointer-events-none" />
                    <input
                      type="date"
                      aria-label="Select custom date"
                      min={toISODate(addDays(today, 0))}
                      value={rescheduleDate.note === 'Custom' ? toISODate(rescheduleDate.date) : ''}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setRescheduleDate({ date: new Date(y, m - 1, d), note: 'Custom' });
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-1 py-2.5 px-3 rounded-xl bg-[#f2f4f2] flex items-center justify-between gap-2 flex-wrap border border-[#c0c9c3]/40">
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="event_available" size={18} className="text-[#003629]" />
                    <span className="text-[12px] text-[#404945] font-medium">Selected:</span>
                  </div>
                  <span className="text-[14px] leading-tight text-[#003629] font-bold text-right ml-auto">
                    {fmtDayComma(rescheduleDate.date)} ({rescheduleDate.note})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleItem(null)}
                  className="py-[13px] px-[18px] bg-[#eceeec] hover:bg-[#e6e9e7] text-[#404945] rounded-full text-[14.5px] font-bold active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReschedule}
                  className="flex-1 py-[13px] bg-[#bce5d6] text-[#003629] font-bold rounded-full text-[14.5px] shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Confirm New Date
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
