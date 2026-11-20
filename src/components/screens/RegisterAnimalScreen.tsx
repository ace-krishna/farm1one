import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  X,
  Tag,
  ScanBarcode,
  Check,
  Minus,
  Plus,
  Info,
  Calendar,
  Dna,
  Egg,
  Feather,
  Mars,
  Venus,
  ArrowRight,
} from 'lucide-react';
import { saveAnimal, dobFromApproxAge, SetupError } from '../../lib/animals';

type Species = 'cow' | 'buffalo' | 'hen' | 'goat';
type Sex = 'male' | 'female';
type AgeMode = 'approximate' | 'exact';

interface Swatch {
  value: string;
  title: string;
  color: string;
  light?: boolean;
  spotted?: boolean;
}

interface SpeciesDef {
  id: Species;
  title: string;
  subtitle: string;
  emoji: string;
  tileBg: string;
  tileBorder: string;
  swatches: Swatch[];
}

const SPECIES: SpeciesDef[] = [
  {
    id: 'cow',
    title: 'Cow',
    subtitle: 'Cattle / Bovine',
    emoji: '🐮',
    tileBg: 'bg-white',
    tileBorder: 'border-[#cbe1d3]',
    swatches: [
      { value: 'reddish-brown', title: 'Reddish Brown / Tan', color: '#8B3A2B' },
      { value: 'black', title: 'Black', color: '#1A1A1A' },
      { value: 'white', title: 'White / Cream', color: '#F5F6F2', light: true },
      { value: 'spotted', title: 'Black & White Spotted', color: '#FFFFFF', light: true, spotted: true },
    ],
  },
  {
    id: 'buffalo',
    title: 'Buffalo',
    subtitle: 'Water Buffalo',
    emoji: '🦬',
    tileBg: 'bg-emerald-50',
    tileBorder: 'border-[#cbe1d3]',
    swatches: [
      { value: 'jet-black', title: 'Jet Black / Murrah', color: '#1A1A1A' },
      { value: 'slate-charcoal', title: 'Slate Charcoal', color: '#383B3E' },
      { value: 'dark-brown', title: 'Dark Brown', color: '#6E5D4F' },
      { value: 'light-grey', title: 'Light Grey / Albino', color: '#E8E5DF', light: true },
    ],
  },
  {
    id: 'hen',
    title: 'Hen',
    subtitle: 'Poultry',
    emoji: '🐔',
    tileBg: 'bg-amber-50',
    tileBorder: 'border-amber-100',
    swatches: [
      { value: 'russet-red', title: 'Russet Red', color: '#A04000' },
      { value: 'jet-black', title: 'Jet Black', color: '#1C1C1E' },
      { value: 'pure-white', title: 'Pure White', color: '#FFFFFF', light: true },
      { value: 'golden-buff', title: 'Golden Buff', color: '#D4A373' },
    ],
  },
  {
    id: 'goat',
    title: 'Goat',
    subtitle: 'Caprine',
    emoji: '🐐',
    tileBg: 'bg-orange-50',
    tileBorder: 'border-orange-100',
    swatches: [
      { value: 'brown', title: 'Brown', color: '#5C4033' },
      { value: 'black', title: 'Black', color: '#1F2421' },
      { value: 'white', title: 'White', color: '#F8F9FA', light: true },
      { value: 'spotted-grey', title: 'Spotted Grey', color: '#A89F91' },
    ],
  },
];

const COW_BREEDS = [
  { value: 'indigenous', title: 'Indigenous / local', sub: 'Desi, Gir, Sahiwal, Red Sindhi, etc.', tag: 'Native', tagActive: true },
  { value: 'crossbred', title: 'Crossbred / exotic', sub: 'HF, Jersey, and their crosses', tag: 'High-yield', tagActive: false },
];

const HEN_BREEDS = [
  { value: 'layer', title: 'Layer', sub: 'Egg Production', Icon: Egg },
  { value: 'broiler', title: 'Broiler', sub: 'Meat Poultry', Icon: Feather },
];

// Uniform scale applied to the whole screen (0.67 = 33% smaller).
const UI_SCALE = 0.67;

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ErrorKey = 'identity' | 'species' | 'color' | 'breed' | 'age' | 'sex';
type Errors = Partial<Record<ErrorKey, string>>;

const ERROR_ORDER: ErrorKey[] = ['identity', 'species', 'color', 'breed', 'age', 'sex'];

const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

interface Props {
  onClose: () => void;
}

export const RegisterAnimalScreen: React.FC<Props> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [earTag, setEarTag] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [breed, setBreed] = useState<string | null>(null);
  const [ageMode, setAgeMode] = useState<AgeMode>('approximate');
  const [unit1, setUnit1] = useState(0); // years (or weeks for hen)
  const [unit2, setUnit2] = useState(0); // months (or days for hen)
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sectionRefs = useRef<Partial<Record<ErrorKey, HTMLElement | null>>>({});
  const isHen = species === 'hen';

  const resetSpeciesDependent = () => {
    setColor(null);
    setBreed(null);
    setUnit1(0);
    setUnit2(0);
    setDob('');
  };

  const chooseSpecies = (next: Species) => {
    if (next === species) return;
    setSpecies(next);
    resetSpeciesDependent();
  };

  const chooseColor = (next: Species, value: string) => {
    if (next !== species) {
      setSpecies(next);
      setBreed(null);
      setUnit1(0);
      setUnit2(0);
      setDob('');
    }
    setColor(value);
  };

  const stepUnit1 = (delta: number) => setUnit1((v) => Math.max(0, v + delta));
  const stepUnit2 = (delta: number) => {
    const max = isHen ? 6 : 11;
    setUnit2((v) => {
      const n = v + delta;
      if (n < 0) return max;
      if (n > max) return 0;
      return n;
    });
  };

  // ---- Age summary ----
  const summary = (() => {
    if (ageMode === 'approximate') {
      if (unit1 === 0 && unit2 === 0) return '—';
      const today = new Date();
      if (isHen) {
        const days = unit1 * 7 + unit2;
        const est = new Date(today.getTime() - days * 86400000);
        const parts: string[] = [];
        if (unit1 > 0) parts.push(`${unit1} ${unit1 === 1 ? 'wk' : 'wks'}`);
        if (unit2 > 0 || unit1 === 0) parts.push(`${unit2} ${unit2 === 1 ? 'day' : 'days'}`);
        return `${est.getDate()} ${MONTHS_SHORT[est.getMonth()]} ${est.getFullYear()} (${parts.join(', ')} old approx)`;
      }
      const target = new Date(today.getFullYear() - unit1, today.getMonth() - unit2, 1);
      const yrs = (unit1 + unit2 / 12).toFixed(1);
      return `${MONTHS_LONG[target.getMonth()]} ${target.getFullYear()} (${yrs} yrs)`;
    }
    if (!dob) return '—';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '—';
    if (isHen) {
      const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
      return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} (${Math.floor(days / 7)} wks, ${days % 7} days old)`;
    }
    const yrs = ((Date.now() - d.getTime()) / (86400000 * 365.25)).toFixed(1);
    return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()} (${yrs} yrs)`;
  })();

  // ---- Validation ----
  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim() && !earTag.trim()) e.identity = 'Enter a name or an ear tag number.';
    if (!species) e.species = 'Select an animal.';
    else if (!color) e.color = 'Select a coat color.';
    if (species === 'cow' && !breed) e.breed = 'Select a breed type.';
    if (species === 'hen' && !breed) e.breed = 'Select Layer or Broiler.';
    if (species) {
      if (ageMode === 'approximate') {
        if (unit1 === 0 && unit2 === 0) e.age = 'Enter the animal’s approximate age.';
      } else if (!dob) e.age = 'Select a date of birth.';
      else if (dob > todayISO()) e.age = 'Date of birth cannot be in the future.';
    }
    if (!sex) e.sex = 'Select gender.';
    return e;
  };

  const errors = submitted ? validate() : {};

  const handleSubmit = async () => {
    if (saving) return;
    const e = validate();
    setSubmitted(true);
    const first = ERROR_ORDER.find((k) => e[k]);
    if (first) {
      sectionRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!species || !color || !sex) return;

    setSaving(true);
    setSaveError(null);
    try {
      await saveAnimal({
        name: name.trim() || null,
        ear_tag: earTag.trim() || null,
        species,
        breed: species === 'cow' ? breed : null,
        coat_color: color,
        hen_purpose: species === 'hen' ? breed : null,
        dob: ageMode === 'exact' ? dob : dobFromApproxAge(species, unit1, unit2),
        sex,
      });
      onClose();
    } catch (err) {
      console.error('Could not save animal:', err);
      setSaveError(
        err instanceof SetupError
          ? 'Saving is not set up yet. Check the Supabase keys in your .env file.'
          : 'Could not save. Check your internet and try again.',
      );
      setSaving(false);
    }
  };

  const setRef = (k: ErrorKey) => (el: HTMLElement | null) => {
    sectionRefs.current[k] = el;
  };

  const ErrorText: React.FC<{ k: ErrorKey }> = ({ k }) =>
    errors[k] ? <p className="text-[11px] font-semibold text-[#ba1a1a] px-1 pt-1">{errors[k]}</p> : null;

  return (
    <div className="h-full w-full overflow-hidden bg-[#f7f9f7]">
    <div
      className="text-[#191c1b] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased relative overflow-hidden bg-[#f7f9f7]"
      style={{ width: `${100 / UI_SCALE}%`, height: `${100 / UI_SCALE}%`, transform: `scale(${UI_SCALE})`, transformOrigin: 'top left' }}
    >
      {/* Top navigation */}
      <header className="shrink-0 z-30 bg-[#f7f9f7] px-5 pt-3 pb-3 border-b border-[#e2ece5]">
        <div className="relative flex items-center justify-between min-h-[40px]">
          <button
            type="button"
            aria-label="Go back"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-[#dde6e0] flex items-center justify-center text-[#191c1b] shadow-sm active:scale-[0.98] z-10 cursor-pointer"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-base font-bold tracking-tight text-[#11352a]">Register Animal</h1>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-[#dde6e0] flex items-center justify-center text-gray-500 shadow-sm active:scale-[0.98] z-10 cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Scrollable form */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
        {/* Name & ear tag */}
        <section aria-label="Primary Details" className="space-y-3" ref={setRef('identity')}>
          <div className="bg-white rounded-2xl p-3.5 border border-[#e1eae3] shadow-sm focus-within:border-[#1b4d3e] focus-within:ring-1 focus-within:ring-[#1b4d3e] transition-all">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="animal-name" className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Tag size={12} fill="#0b8f5c" color="#0b8f5c" /> Name / Nickname
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#065f3e', backgroundColor: '#e6f7f0' }}>
                Required
              </span>
            </div>
            <input
              id="animal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gauri, Nandi, Daisy"
              className="w-full text-base font-bold text-[#191c1b] placeholder-gray-400 border-0 p-0 outline-none bg-transparent"
            />
          </div>
          <div className="bg-white rounded-2xl p-3.5 border border-[#e1eae3] shadow-sm focus-within:border-[#1b4d3e] focus-within:ring-1 focus-within:ring-[#1b4d3e] transition-all">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="tag-number" className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ScanBarcode size={13} color="#0b8f5c" /> Ear Tag Number
              </label>
              <span className="text-[11px] font-medium text-gray-400">Optional</span>
            </div>
            <input
              id="tag-number"
              type="text"
              value={earTag}
              onChange={(e) => setEarTag(e.target.value)}
              placeholder="e.g., IN-MH-2024-8841"
              className="w-full text-sm font-semibold tracking-wide text-[#191c1b] placeholder-gray-400 border-0 p-0 outline-none bg-transparent uppercase"
            />
          </div>
          <ErrorText k="identity" />
        </section>

        {/* Species & coat color */}
        <section aria-label="Animal Species and Coat Colors" className="space-y-2.5" ref={setRef('species')}>
          <div className="flex items-center justify-between px-1 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Species &amp; Coat Color</h2>
            <span className="text-[11px] font-medium text-gray-500">Select animal &amp; color</span>
          </div>
          <div
            ref={setRef('color') as React.Ref<HTMLDivElement>}
            className="bg-white rounded-[1.75rem] border border-[#dde6e0] shadow-sm overflow-hidden"
          >
            {SPECIES.map((s, i) => {
              const active = species === s.id;
              const last = i === SPECIES.length - 1;
              return (
                <div
                  key={s.id}
                  onClick={() => chooseSpecies(s.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    active ? 'bg-[#f0f6f2]' : 'bg-white hover:bg-gray-50'
                  } ${last ? '' : 'border-b border-[#e3ebe5]'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl ${s.tileBg} flex items-center justify-center text-2xl shadow-xs border ${s.tileBorder} shrink-0`}>
                      {s.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
                        <span className={`text-base tracking-tight block ${active ? 'font-extrabold text-[#11352a]' : 'font-bold text-gray-800'}`}>
                          {s.title}
                        </span>
                        {active && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1b4d3e] text-white tracking-wider uppercase whitespace-nowrap">
                            Selected
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${active ? 'font-semibold text-emerald-800' : 'font-medium text-gray-500'}`}>
                        {s.subtitle}
                      </span>
                    </div>
                  </div>
                  <div role="radiogroup" aria-label={`${s.title} coat colors`} className={`flex items-center gap-2 shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>
                    {s.swatches.map((sw) => {
                      const checked = active && color === sw.value;
                      return (
                        <button
                          key={sw.value}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          title={sw.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            chooseColor(s.id, sw.value);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer overflow-hidden ${
                            sw.light ? 'border border-gray-300' : 'border border-black/10'
                          }`}
                          style={{
                            backgroundColor: sw.color,
                            backgroundImage: sw.spotted
                              ? 'radial-gradient(circle at 30% 30%, #1A1A1A 0 5px, transparent 5.5px), radial-gradient(circle at 72% 40%, #1A1A1A 0 4px, transparent 4.5px), radial-gradient(circle at 45% 78%, #1A1A1A 0 5px, transparent 5.5px)'
                              : undefined,
                            boxShadow: checked ? '0 0 0 2px #ffffff, 0 0 0 4px #1b4d3e' : undefined,
                            transform: checked ? 'scale(1.08)' : undefined,
                          }}
                        >
                          <Check
                            size={13}
                            strokeWidth={3}
                            className={sw.light ? 'text-gray-800' : 'text-white'}
                            style={{ opacity: checked ? 1 : 0 }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <ErrorText k="species" />
          <ErrorText k="color" />
        </section>

        {/* Breed (cow & hen only) */}
        {species === 'cow' && (
          <section aria-label="Breed Selection" ref={setRef('breed')}>
            <div className="bg-white rounded-[1.75rem] p-4 border border-[#dde6e0] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Dna size={12} fill="#0B8F5C" color="#0B8F5C" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Breed Type (Cow)</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Recommended
                </span>
              </div>
              <div className="flex flex-col gap-2" role="radiogroup">
                {COW_BREEDS.map((b) => {
                  const on = breed === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setBreed(b.value)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer ${
                        on ? 'border-2 border-[#1b4d3e] bg-[#f0f6f2] shadow-xs' : 'border border-[#dde6e0] bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            on ? 'bg-[#1b4d3e] text-white' : 'border-2 border-gray-300 bg-white text-transparent'
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div>
                          <span className={`text-sm font-bold block ${on ? 'text-[#11352a]' : 'text-gray-800'}`}>{b.title}</span>
                          <span className="text-[11px] font-medium text-gray-500">{b.sub}</span>
                        </div>
                      </div>
                      <span className={`text-xs shrink-0 ${b.tagActive ? 'font-bold text-[#1b4d3e]' : 'font-semibold text-gray-400'}`}>{b.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <ErrorText k="breed" />
          </section>
        )}

        {species === 'hen' && (
          <section aria-label="Purpose and Breed Type" ref={setRef('breed')}>
            <div className="bg-white rounded-[1.75rem] p-4 border border-[#dde6e0] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Egg size={12} fill="#0B8F5C" color="#0B8F5C" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Purpose / Breed Type (Hen)</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Select One
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                {HEN_BREEDS.map(({ value, title, sub, Icon }) => {
                  const on = breed === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setBreed(value)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-[0.98] cursor-pointer ${
                        on ? 'border-2 border-[#1b4d3e] bg-[#f0f6f2] shadow-xs' : 'border border-[#dde6e0] bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${on ? 'bg-[#1b4d3e] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Icon size={16} strokeWidth={2.5} />
                      </div>
                      <span className={`text-sm font-bold ${on ? 'text-[#11352a]' : 'text-gray-700'}`}>{title}</span>
                      <span className="text-[11px] font-medium text-gray-500">{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <ErrorText k="breed" />
          </section>
        )}

        {/* Age estimation */}
        <section ref={setRef('age')} className="bg-white rounded-[1.75rem] p-4 border border-[#dbe6df] shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-[#11352a]">Age Estimation</h3>
              <span className="text-gray-400" title="Approximate or enter exact birth date">
                <Info size={12} fill="currentColor" color="white" />
              </span>
            </div>
            <div role="tablist" className="inline-flex p-1 bg-[#f0f4f1] rounded-full border border-[#dde6e0]">
              {(['approximate', 'exact'] as AgeMode[]).map((m) => {
                const on = ageMode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setAgeMode(m)}
                    className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${on ? 'font-bold text-white shadow-xs' : 'font-semibold text-[#4B5348]'}`}
                    style={{ backgroundColor: on ? '#5585d4' : 'transparent' }}
                  >
                    {m === 'approximate' ? 'Approximate' : 'Exact DOB'}
                  </button>
                );
              })}
            </div>
          </div>

          {ageMode === 'approximate' ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { label: isHen ? 'Weeks' : 'Years', value: unit1, step: stepUnit1 },
                { label: isHen ? 'Days' : 'Months', value: unit2, step: stepUnit2 },
              ].map((u) => (
                <div key={u.label} className="bg-[#f8faf8] border border-[#e3eae4] rounded-2xl p-2.5 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">{u.label}</span>
                  <div className="flex items-center justify-between w-full px-1">
                    <button
                      type="button"
                      aria-label={`Decrease ${u.label}`}
                      onClick={() => u.step(-1)}
                      className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-700 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="text-xl font-extrabold text-[#191c1b]">{u.value}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${u.label}`}
                      onClick={() => u.step(1)}
                      className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-700 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-1">
              <div className="bg-[#f8faf8] border border-[#e3eae4] rounded-2xl p-3 flex flex-col gap-1.5">
                <label htmlFor="exact-birth-date" className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Date of Birth
                </label>
                <input
                  id="exact-birth-date"
                  type="date"
                  value={dob}
                  max={todayISO()}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-sm font-bold text-[#191c1b] bg-white border border-[#dde6e0] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#1b4d3e] focus:border-[#1b4d3e]"
                />
              </div>
            </div>
          )}

          <div className="bg-[#f0f6f2] border border-[#cbe4d4] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium shrink-0">
              <Calendar size={14} strokeWidth={2.5} color="#0b8f5c" />
              <span>Calculated Est. Birth:</span>
            </div>
            <span className="font-bold text-right" style={{ color: '#0b8f5c' }}>
              {summary}
            </span>
          </div>
          <ErrorText k="age" />
        </section>

        {/* Gender */}
        <section aria-label="Animal Biological Sex" className="space-y-2" ref={setRef('sex')}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">GENDER</h3>
          <div role="radiogroup" className="flex items-center gap-1.5 p-1 bg-[#f0f4f1] rounded-full border border-[#dde6e0]">
            {([
              { v: 'male', label: 'Male', Icon: Mars, bg: '#77b6d4' },
              { v: 'female', label: 'Female', Icon: Venus, bg: '#d47095' },
            ] as const).map(({ v, label, Icon, bg }) => {
              const on = sex === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSex(v)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full font-bold text-sm transition-all active:scale-[0.98] cursor-pointer border ${
                    on ? 'shadow-sm text-white' : 'text-gray-600 border-transparent'
                  }`}
                  style={{ backgroundColor: on ? bg : 'transparent', borderColor: on ? bg : 'transparent', color: on ? '#fff' : '#4B5348' }}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <ErrorText k="sex" />
        </section>
      </main>

      {/* Sticky action bar */}
      <footer className="shrink-0 bg-[#f7f9f7]/95 backdrop-blur-lg border-t border-[#e2ece5] px-4 pt-3 pb-5 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {saveError && (
          <p role="alert" className="text-[12px] font-semibold text-[#ba1a1a] text-center pb-2">
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 px-6 rounded-full text-white font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-default"
          style={{ backgroundColor: '#0b8f5c', boxShadow: '0 10px 15px -3px rgba(11,143,92,0.3)' }}
        >
          <span>{saving ? 'SAVING…' : 'SUBMIT'}</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </footer>
    </div>
    </div>
  );
};
