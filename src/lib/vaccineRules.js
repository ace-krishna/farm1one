// Farm One: vaccine rules (bundled in the app, works offline).
// Ages are in DAYS from birth (cattle, buffalo, goats) or from hatch (poultry).
// Sources: "nddb" = NDDB cattle and buffalo PDF, "poultry-guide" = chicken PDF,
// "research" = state and ICAR-linked sources (goats, plus a few extra poultry doses).
// All values are indicative. A vet and the vaccine label take priority.

const m = (n) => n * 30; // months to days
const w = (n) => n * 7;  // weeks to days

export const VACCINE_RULES = [
  // ---------- CATTLE AND BUFFALO (source: NDDB) ----------
  { id: "cb-fmd", species: ["cow", "buffalo"], name: "FMD", source: "nddb",
    doses: [{ label: "First dose", atAgeDays: m(4) }, { label: "Booster", afterPrevDays: 30 }],
    repeatEveryDays: 180, season: "Mar-Apr and Sep-Oct (local campaign dates apply)" },
  { id: "cb-hs", species: ["cow", "buffalo"], name: "HS (haemorrhagic septicaemia)", source: "nddb",
    doses: [{ label: "First dose", atAgeDays: m(6) }], repeatEveryDays: 365,
    endemicOnly: true, season: "before monsoon" },
  { id: "cb-bq", species: ["cow", "buffalo"], name: "Black quarter (BQ)", source: "nddb",
    doses: [{ label: "First dose", atAgeDays: m(6) }], repeatEveryDays: 365,
    endemicOnly: true, season: "before monsoon" },
  { id: "cb-bruc", species: ["cow", "buffalo"], name: "Brucellosis", source: "nddb",
    doses: [{ label: "Single dose", atAgeDays: m(4), maxAgeDays: m(8) }],
    once: true, sex: "female", notes: "Female calves only. Never bulls or pregnant animals." },
  { id: "cb-theil", species: ["cow", "buffalo"], name: "Theileriosis", source: "nddb",
    doses: [{ label: "Single dose", atAgeDays: m(3) }], once: true,
    crossbredOnly: true, notes: "Crossbred and exotic cattle only." },
  { id: "cb-anthrax", species: ["cow", "buffalo"], name: "Anthrax", source: "nddb",
    doses: [{ label: "First dose", atAgeDays: m(4) }], repeatEveryDays: 365, endemicOnly: true },
  { id: "cb-ibr", species: ["cow", "buffalo"], name: "IBR", source: "nddb", active: false,
    doses: [{ label: "First dose", atAgeDays: m(3) }, { label: "Booster", afterPrevDays: 30 }],
    repeatEveryDays: 180, notes: "NDDB notes the vaccine is presently not produced in India." },
  // Rabies is vet-led and event-based. Never auto-schedule. Start only when a bite is logged.
  { id: "cb-rabies", species: ["cow", "buffalo", "goat"], name: "Rabies (after suspected bite)", source: "nddb",
    auto: false, eventBased: true, afterBiteDays: [0, 3, 7, 14, 28, 90], optionalLast: true,
    notes: "Urgent vet care. Day 0 is the immediate dose, day 3 is the '4th day' dose, day 90 optional." },

  // ---------- GOATS (source: research, NOT in the uploaded PDFs) ----------
  { id: "g-ppr", species: ["goat"], name: "PPR", source: "research",
    doses: [{ label: "Single dose", atAgeDays: m(3), maxAgeDays: m(4) }], repeatEveryDays: 365 * 3,
    notes: "Some programmes repeat yearly. Avoid in late pregnancy." },
  { id: "g-pox", species: ["goat"], name: "Goat pox", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(3), maxAgeDays: m(4) }, { label: "Booster", afterPrevDays: 21 }],
    repeatEveryDays: 365, notes: "Goat-pox vaccine for goats only." },
  { id: "g-et", species: ["goat"], name: "Enterotoxaemia (ET)", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(3), maxAgeDays: m(4) }, { label: "Booster", afterPrevDays: 21 }],
    repeatEveryDays: 180, season: "before monsoon", notes: "Repeat every 6-12 months." },
  { id: "g-fmd", species: ["goat"], name: "FMD", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(3) }, { label: "Booster", afterPrevDays: 21 }],
    repeatEveryDays: 180 },
  { id: "g-tt", species: ["goat"], name: "Tetanus toxoid", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(3) }, { label: "Second dose", afterPrevDays: 90 }],
    repeatEveryDays: 365, notes: "Also after a deep wound." },
  { id: "g-hs", species: ["goat"], name: "HS", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(6) }], repeatEveryDays: 365, notes: "Some vets advise 6-monthly." },
  { id: "g-anthrax", species: ["goat"], name: "Anthrax", source: "research",
    doses: [{ label: "First dose", atAgeDays: m(4) }], repeatEveryDays: 365, endemicOnly: true },
  { id: "g-bt", species: ["goat"], name: "Bluetongue", source: "research", optional: true,
    doses: [{ label: "First dose", atAgeDays: m(3) }], repeatEveryDays: 365, notes: "Where advised locally." },
  { id: "g-brucrev1", species: ["goat"], name: "Brucella Rev-1", source: "research", active: false,
    doses: [{ label: "Single dose", atAgeDays: m(3), maxAgeDays: m(5) }], once: true, sex: "female",
    notes: "Not in general field use in India." },
  { id: "g-ccpp", species: ["goat"], name: "CCPP", source: "research", riskBased: true, doses: [],
    repeatEveryDays: 365, notes: "Only in outbreak areas, on vet advice." },

  // ---------- POULTRY (source: chicken PDF, ages in days from hatch) ----------
  { id: "p-marek", species: ["hen"], birdType: ["layer", "broiler"], name: "Marek's disease", source: "poultry-guide",
    doses: [{ label: "Day-old dose", atAgeDays: 1 }], once: true, notes: "Usually given at the hatchery. Ask for the hatchery record." },
  { id: "p-nd1", species: ["hen"], birdType: ["layer", "broiler"], name: "Newcastle (Ranikhet), early", source: "poultry-guide",
    doses: [{ label: "Early live vaccine", atAgeDays: 1, maxAgeDays: 7 }] },
  { id: "p-ib-b", species: ["hen"], birdType: ["broiler"], name: "Infectious bronchitis (IB)", source: "poultry-guide",
    doses: [{ label: "Early dose", atAgeDays: 1, maxAgeDays: 14 }] },
  { id: "p-ib-l", species: ["hen"], birdType: ["layer"], name: "Infectious bronchitis (IB)", source: "poultry-guide",
    doses: [{ label: "First dose", atAgeDays: 14, maxAgeDays: 21 }] },
  { id: "p-ibd-b", species: ["hen"], birdType: ["broiler"], name: "IBD (Gumboro)", source: "poultry-guide",
    doses: [{ label: "First dose", atAgeDays: 12, maxAgeDays: 14 }, { label: "Booster, if indicated", atAgeDays: 18, maxAgeDays: 21, optional: true }] },
  { id: "p-ibd-l", species: ["hen"], birdType: ["layer"], name: "IBD (Gumboro)", source: "poultry-guide",
    doses: [{ label: "First dose", atAgeDays: 12, maxAgeDays: 15 }, { label: "Booster, if indicated", atAgeDays: 24, maxAgeDays: 28, optional: true }] },
  { id: "p-ndb-b", species: ["hen"], birdType: ["broiler"], name: "Newcastle booster", source: "poultry-guide",
    doses: [{ label: "Booster", atAgeDays: 21, maxAgeDays: 28 }] },
  { id: "p-ndib-1", species: ["hen"], birdType: ["layer"], name: "Newcastle / IB booster", source: "poultry-guide",
    doses: [{ label: "Booster 1", atAgeDays: w(4), maxAgeDays: w(6) }, { label: "Booster 2", atAgeDays: w(10), maxAgeDays: w(14) }] },
  { id: "p-pox", species: ["hen"], birdType: ["layer"], name: "Fowl pox", source: "poultry-guide",
    doses: [{ label: "First dose (wing web)", atAgeDays: w(6), maxAgeDays: w(9) }] },
  { id: "p-r2b", species: ["hen"], birdType: ["layer"], name: "Newcastle R2B", source: "poultry-guide",
    doses: [{ label: "R2B dose", atAgeDays: w(6), maxAgeDays: w(10) }], notes: "Follow local vet advice and label." },
  { id: "p-coryza", species: ["hen"], birdType: ["layer"], name: "Coryza / fowl cholera", source: "poultry-guide",
    riskBased: true, doses: [], windowDays: [w(6), w(14)], notes: "Risk-based only." },
  { id: "p-prelay", species: ["hen"], birdType: ["layer"], name: "Newcastle / IB pre-lay (inactivated)", source: "poultry-guide",
    doses: [{ label: "Pre-lay dose", atAgeDays: w(16), maxAgeDays: w(18) }] },
  { id: "p-eds", species: ["hen"], birdType: ["layer"], name: "EDS '76", source: "poultry-guide",
    doses: [{ label: "Pre-lay dose", atAgeDays: w(16), maxAgeDays: w(18) }], once: true },
  // Extra doses from other sources, not in your PDF. Hidden by default until you confirm with a vet.
  { id: "p-pox2", species: ["hen"], birdType: ["layer"], name: "Fowl pox, booster", source: "research", active: false,
    doses: [{ label: "Booster", atAgeDays: w(14), maxAgeDays: w(18) }] },
  { id: "p-nd-rep", species: ["hen"], birdType: ["layer"], name: "Newcastle, repeat", source: "research", active: false,
    doses: [{ label: "Repeat", atAgeDays: w(40) }], repeatEveryDays: 60 },
];

// Shown before any vaccination (from your two PDFs).
export const SAFETY_CHECKLIST = [
  "Animal or flock is healthy (not sick, stressed or dehydrated)",
  "Vaccine name, expiry date and batch checked",
  "Cold chain kept as per the label (commonly 2-8 C), away from sunlight",
  "Dose and route followed exactly as per the label",
  "Pregnant animals: ask the vet first",
  "Poultry drinking water: clean, no disinfectant residue, use within the label's time",
  "Record the batch number, date and next due date",
];

const DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);

// animal: { species, dob (Date, or hatch date), sex, isCrossbred, birdType }
// given: [{ ruleId, label }] already done, so they are skipped.
export function buildSchedule(animal, given = [], rules = VACCINE_RULES) {
  const rows = [];
  for (const r of rules) {
    if (r.active === false || r.auto === false || r.eventBased) continue;
    if (!r.species.includes(animal.species)) continue;
    if (r.sex && r.sex !== animal.sex) continue;
    if (r.crossbredOnly && !animal.isCrossbred) continue;
    if (r.birdType && !r.birdType.includes(animal.birdType)) continue;
    let prev = null;
    for (const d of r.doses) {
      const due = d.atAgeDays != null ? addDays(animal.dob, d.atAgeDays) : addDays(prev, d.afterPrevDays);
      prev = due;
      if (given.some((g) => g.ruleId === r.id && g.label === d.label)) continue;
      rows.push({ ruleId: r.id, name: r.name, label: d.label, dueDate: due,
        latestDate: d.maxAgeDays ? addDays(animal.dob, d.maxAgeDays) : null,
        optional: !!(d.optional || r.optional), riskBased: !!r.riskBased, notes: r.notes || "" });
    }
    // Next repeat is created when the last dose is marked done (due = given date + repeatEveryDays).
  }
  return rows.sort((a, b) => a.dueDate - b.dueDate);
}
