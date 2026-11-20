import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { CameraScanScreen, PhotoConfirmScreen } from './CameraScanScreen';
import { fetchAnimals, getCachedAnimals, type Animal, type Species } from '../../lib/animals';

interface AnimalItem {
  id: string;
  name: string;
  breed: string; // shown as the species label, e.g. "Cow"
  tag: string; // e.g. "#8841", empty if the animal has no ear tag
  emoji: string;
}

const SPECIES_LABEL: Record<Species, string> = { cow: 'Cow', buffalo: 'Buffalo', goat: 'Goat', hen: 'Hen' };
const SPECIES_EMOJI: Record<Species, string> = { cow: '🐮', buffalo: '🦬', goat: '🐐', hen: '🐔' };

const toAnimalItem = (a: Animal): AnimalItem => ({
  id: a.id,
  name: a.name || a.ear_tag || SPECIES_LABEL[a.species],
  breed: SPECIES_LABEL[a.species],
  tag: a.ear_tag ? `#${a.ear_tag}` : '',
  emoji: SPECIES_EMOJI[a.species],
});

const animalSubtitle = (item: AnimalItem) => (item.tag ? `${item.breed} • ${item.tag}` : item.breed);

const HOME_TEXT = {
  en: { brand: 'FARM ONE', welcome: 'Welcome, Home', vaccination: 'Vaccination', overview: 'Quick overview', readWatch: 'Read & Watch', dues: 'Upcoming Dues' },
  hi: { brand: 'फार्म वन', welcome: 'स्वागत है, होम', vaccination: 'टीकाकरण', overview: 'त्वरित अवलोकन', readWatch: 'पढ़ें और देखें', dues: 'आगामी देय' },
  mr: { brand: 'फार्म वन', welcome: 'स्वागत, होम', vaccination: 'लसीकरण', overview: 'झटपट आढावा', readWatch: 'वाचा आणि पहा', dues: 'आगामी देय' },
} as const;

interface StitchHomeScreenProps {
  onAddAnimal?: () => void;
  onOpenVaccination?: () => void;
}

export const StitchHomeScreen: React.FC<StitchHomeScreenProps> = ({ onAddAnimal, onOpenVaccination }) => {
  const { language, setLanguage, t } = useLanguage();
  const H = HOME_TEXT[language as 'en' | 'hi' | 'mr'] ?? HOME_TEXT.en;

  // Registered animals: shown from the local cache first, then refreshed from Supabase.
  const [animals, setAnimals] = useState<Animal[]>(getCachedAnimals);
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
  const registeredLivestock = animals.map(toAnimalItem);

  // Translated strings contain a hard-coded "4"; swap in the real count.
  const withCount = (text: string) =>
    text.replace(/[4४]/, language === 'mr' ? String(animals.length).replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]) : String(animals.length));

  // Modals state
  const [isScanCameraOpen, setIsScanCameraOpen] = useState(false);
  const [isUploadGalleryOpen, setIsUploadGalleryOpen] = useState(false);
  const [cameraSubject, setCameraSubject] = useState<string | null>(null); // non-null = camera screen open
  const [selectedCameraAnimal, setSelectedCameraAnimal] = useState<string | null>(null);
  const [selectedGalleryAnimal, setSelectedGalleryAnimal] = useState<string | null>(null);

  // Bottom dock active tab (Home = 0, Marketplace = 1, Farmer Profile = 2)
  const [activeDockIndex, setActiveDockIndex] = useState(0);
  const [dockNotification, setDockNotification] = useState<string | null>(null);


  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsScanCameraOpen(false);
        setIsUploadGalleryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCameraAnimalClick = (animal: AnimalItem) => {
    setSelectedCameraAnimal(animal.id);
    setTimeout(() => {
      setIsScanCameraOpen(false);
      setCameraSubject(animal.name);
    }, 700);
  };

  const handleCameraNewAnimalClick = () => {
    setSelectedCameraAnimal('new');
    setTimeout(() => {
      setIsScanCameraOpen(false);
      setCameraSubject('New animal');
    }, 700);
  };

  // Gallery flow: pick an animal -> system photo library -> confirmation (Reselect / Done).
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryPhoto, setGalleryPhoto] = useState<string | null>(null);

  const openGalleryPicker = () => galleryInputRef.current?.click();

  const handleGalleryAnimalClick = (animal: AnimalItem) => {
    setSelectedGalleryAnimal(animal.id);
    openGalleryPicker();
  };

  const handleGalleryNewAnimalClick = () => {
    setSelectedGalleryAnimal('new');
    openGalleryPicker();
  };

  const onGalleryFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return; // cancelled: stay on the selection sheet
    const reader = new FileReader();
    reader.onload = () => {
      setGalleryPhoto(String(reader.result));
      setIsUploadGalleryOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const closeGalleryConfirm = () => {
    setGalleryPhoto(null);
    setSelectedGalleryAnimal(null);
  };

  const dockToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (dockToastTimer.current) clearTimeout(dockToastTimer.current); }, []);

  const handleDockItemClick = (index: number, label: string) => {
    setActiveDockIndex(index);
    if (dockToastTimer.current) clearTimeout(dockToastTimer.current);
    if (index !== 0) {
      setDockNotification(`${label} screen will be added when you provide its Stitch code.`);
      dockToastTimer.current = setTimeout(() => setDockNotification(null), 2500);
    } else {
      setDockNotification(null);
    }
  };

  return (
    <div
      className="text-[#191c1b] h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative select-none antialiased overflow-clip"
      style={{ background: 'linear-gradient(rgb(209,243,255) 0%, rgb(209,243,255) 42%, rgb(199,255,204) 60%, rgb(199,255,204) 100%)' }}
    >
      {/* HEADER: FARM FAMILY | Home + Language Toggle */}
      <header className="shrink-0 w-full z-30 py-2.5 px-4 backdrop-blur-md bg-white/70 border-b border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          {/* Brand & Heading */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-[#404945] uppercase tracking-wider leading-none">
              {H.brand}
            </span>
            <h1 className="text-[17px] font-semibold text-[#191c1b] leading-tight mt-1">
              {H.welcome}
            </h1>
          </div>

          {/* Tri-Lingual Language Toggle Pill (sliding indicator, fixed segment widths) */}
          <div className="relative inline-grid grid-cols-3 p-0.5 bg-[#edeeec] rounded-full items-center shadow-inner">
            {([
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' },
            ] as const).map((opt) => {
              const active = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`relative z-10 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap text-center cursor-pointer transition-colors duration-200 ${
                    active ? 'text-white' : 'text-[#404945] hover:text-[#00362a]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="langPill"
                      className="absolute inset-0 -z-10 rounded-full bg-[#00362a] shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                  <span style={opt.code === 'en' ? undefined : { letterSpacing: '0.3px' }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto flex flex-col pt-3 pb-24 px-4 gap-4 scrollbar-none">
        {/* SECTION 1: QUICK ACCESS CHIPS (PILL SHAPED) */}
        <section>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold text-[#404945] uppercase tracking-wider">
              {t('quickActions')}
            </span>
            <span className="text-[10px] text-[#404945]">{t('recentlyVisited')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* My Cattle Chip (Full Pill) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full bg-white border border-[#bfc9c3]/30 shadow-sm text-left hover:bg-[#f3f4f2] transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#b5efda] flex items-center justify-center text-[#002018] shrink-0">
                <span className="material-symbols-outlined text-[19px]">pets</span>
              </div>
              <div className="overflow-hidden pr-2">
                <p className="text-[11px] font-bold text-[#191c1b] truncate leading-tight">
                  {t('myCattle')}
                </p>
                <p className="text-[9px] text-[#404945] truncate mt-0.5">
                  {withCount(t('animalsRegistered'))}
                </p>
              </div>
            </motion.button>

            {/* Mandis & Rates Chip (Full Pill) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full bg-white border border-[#bfc9c3]/30 shadow-sm text-left hover:bg-[#f3f4f2] transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#2f1500] shrink-0">
                <span className="material-symbols-outlined text-[19px]">vaccines</span>
              </div>
              <div className="overflow-hidden pr-2">
                <p className="text-[11px] font-bold text-[#191c1b] truncate leading-tight">
                  {H.vaccination}
                </p>
                <p className="text-[9px] text-[#404945] truncate mt-0.5">
                  {H.overview}
                </p>
              </div>
            </motion.button>
          </div>
        </section>

        {/* SECTION 2: MY REGISTERED ANIMALS */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#00362a]">pets</span>
              <span className="text-[10px] font-bold text-[#191c1b] uppercase tracking-wider">
                {t('myRegisteredAnimals')}
              </span>
            </div>
            <button
              type="button"
              className="text-[10px] text-[#00362a] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{withCount(t('viewAll4'))}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>

          {/* Horizontal Animal Avatars */}
          <div className="flex overflow-x-auto scrollbar-none gap-3 py-1 px-0.5">
            {registeredLivestock.length === 0 && (
              <p className="text-[11px] text-[#404945] py-3 px-1">No animals registered yet.</p>
            )}
            {registeredLivestock.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => {
                  setSelectedCameraAnimal(item.id);
                  setIsScanCameraOpen(true);
                }}
                className="flex flex-col items-center shrink-0 text-center cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center text-white shadow-xs">
                  <span className="text-[28px] leading-none">{item.emoji}</span>
                </div>
                <span className="text-[12px] font-bold text-[#191c1b] mt-1.5 truncate w-16">
                  {item.name}
                </span>
                <span className="text-[10px] text-[#404945] truncate w-16">{animalSubtitle(item)}</span>
              </motion.button>
            ))}
          </div>

          {/* Register / Add Farm Animal Card (Full Pill Container) */}
          <div className="mt-2.5">
            <div className="p-2 pl-2.5 pr-2.5 rounded-[28px] bg-[#f3f4f2] border border-[#bfc9c3]/30 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-[#b5efda] flex items-center justify-center text-[#002018] shrink-0">
                  <span className="material-symbols-outlined text-[22px]">add</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-[#191c1b] truncate leading-tight">
                    {t('registerAddAnimal')}
                  </p>
                  <p className="text-[9px] text-[#404945] truncate">
                    {t('registerSubtitle')}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onAddAnimal}
                className="px-3 py-2 rounded-full bg-[#00362a] text-white text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs cursor-pointer hover:bg-[#00261d] transition-all"
              >
                <span>{t('addAnimalBtn')}</span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRIMARY HERO CARD — AI ANIMAL HEALTH SCAN */}
        <section>
          <div
            className="relative overflow-hidden rounded-[24px] p-3.5 text-white border border-white/25 border-t-white/40"
            style={{
              background: 'linear-gradient(150deg, #3b7d69 0%, #2a6654 28%, #1c4a3b 62%, #123329 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 20px 40px -15px rgba(10,42,34,0.45)',
            }}
          >
            {/* Ambient glows */}
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-300/25 blur-2xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-40 h-32 rounded-full bg-[#7fc4ab]/25 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#0a2a21]/50 blur-2xl pointer-events-none" />
            <div className="relative z-10">
            {/* Top row */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#b5efda] text-[9px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b5efda]" />
                {t('instantDiagnosticAi')}
              </span>
              <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[15px]">
                  center_focus_strong
                </span>
              </div>
            </div>

            <h2 className="text-[19px] text-white leading-tight font-bold drop-shadow-sm">
              {t('aiAnimalHealthScan')}
            </h2>
            <p className="text-[10.5px] text-white/80 leading-relaxed mt-1 mb-3.5">
              {t('aiScanDesc')}
            </p>

            {/* Liquid Glass Buttons (Pill Format) */}
            <div className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="scanAnimalNowBtn"
                onClick={() => setIsScanCameraOpen(true)}
                className="w-full h-10 rounded-full text-[13px] flex items-center justify-center gap-1.5 bg-white text-[#0c392d] font-bold shadow-lg shadow-black/10 border border-white/80 hover:bg-white/95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-[#0c392d]">
                  photo_camera
                </span>
                <span>{t('scanAnimalNow')}</span>
                <span className="material-symbols-outlined text-[15px] ml-1 text-[#0c392d]">
                  arrow_forward
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="uploadFromGalleryBtn"
                onClick={() => setIsUploadGalleryOpen(true)}
                className="w-full h-10 rounded-full text-[13px] flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 font-semibold shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-white">
                  photo_library
                </span>
                <span>{t('uploadFromGallery')}</span>
                <span className="material-symbols-outlined text-[15px] ml-1 text-white">
                  arrow_forward
                </span>
              </motion.button>
            </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: FARM SERVICES — Essential Updates */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#134e3f] font-bold uppercase tracking-wider">
                {t('farmServices')}
              </span>
              <h3 className="text-[16px] text-[#191c1b] font-bold leading-tight mt-0.5">
                {t('essentialUpdates')}
              </h3>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* i-Learning & Guides (Deep Rounded Card with Pill Button) */}
            <div className="w-full rounded-[32px] bg-white border border-[#bfc9c3]/30 shadow-sm p-4 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-10 h-10 rounded-full bg-[#cce5ff] flex items-center justify-center text-[#001d31] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#004971] text-white text-[10px] font-bold">
                    {H.readWatch}
                  </span>
                </div>
                <h4 className="text-[17px] text-[#191c1b] font-bold mb-0.5">
                  {t('iLearning')}
                </h4>
                <p className="text-[12px] text-[#404945] leading-normal">
                  {t('iLearningDesc')}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full h-10 rounded-full bg-[#d2f6fa] hover:brightness-95 text-[#134e3f] text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{t('watchModules')}</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Vaccination Schedule (Deep Rounded Card with Pill Button) */}
            <div
              onClick={onOpenVaccination}
              className="w-full rounded-[32px] bg-white border border-[#bfc9c3]/30 shadow-sm p-4 flex flex-col justify-between gap-2.5 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-10 h-10 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#2f1500] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">vaccines</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">schedule</span>{' '}
                    {H.dues}
                  </span>
                </div>
                <h4 className="text-[17px] text-[#191c1b] font-bold mb-0.5">
                  {t('vaccinationSchedule')}
                </h4>
                <p className="text-[12px] text-[#404945] leading-normal">
                  {t('vaccinationDesc')}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full h-10 rounded-full bg-[#faf9d2] hover:brightness-95 text-[#134e3f] text-[12px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                >
                  <span>{t('viewVaccinationSchedule')}</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 5: ULTRA-PREMIUM LIQUID GLASS DOCK (SLEEK PILL) */}
      <nav
        id="liquidDockContainer"
        className="absolute inset-x-4 max-w-[390px] mx-auto z-40 select-none pointer-events-auto"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div
          id="liquidGlassDock"
          className="relative w-full rounded-full p-1.5 grid grid-cols-3 items-center"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow:
              'rgba(19,78,63,0.16) 0px 16px 36px -4px, rgba(0,0,0,0.04) 0px 4px 12px 0px, rgba(255,255,255,0.95) 0px 1.5px 1.5px 0px inset, rgba(19,78,63,0.08) 0px -1px 2px 0px inset',
          }}
        >
          {([
            { icon: 'home', label: t('home') },
            { icon: 'storefront', label: t('marketplace') },
            { icon: 'account_circle', label: t('farmerProfile') },
          ] as const).map((tab, index) => {
            const active = activeDockIndex === index;
            return (
              <button
                key={tab.icon}
                type="button"
                onClick={() => handleDockItemClick(index, tab.label)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center h-[52px] rounded-full cursor-pointer transition-colors duration-200 ${
                  active ? 'text-[#00362a]' : 'text-[#404945] hover:text-[#00362a]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dockPill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(19,78,63,0.14) 0%, rgba(181,239,218,0.42) 100%)',
                      border: '1px solid rgba(255,255,255,0.95)',
                      boxShadow:
                        'rgba(19,78,63,0.12) 0px 4px 16px, rgba(255,255,255,0.95) 0px 1px 2px inset, rgba(19,78,63,0.05) 0px -1px 2px inset',
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className="relative material-symbols-outlined text-[26px] leading-none"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="relative text-[11px] leading-tight tracking-tight mt-0.5 font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Temporary friendly toast if other dock tabs are tapped */}
        <AnimatePresence>
          {dockNotification && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 inset-x-2 bg-stone-900/90 text-white text-[10px] py-1 px-3 rounded-full text-center backdrop-blur-md shadow-lg border border-white/10"
            >
              {dockNotification}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onGalleryFilePicked} />
      {galleryPhoto && (
        <PhotoConfirmScreen
          photo={galleryPhoto}
          secondary="reselect"
          onSecondary={openGalleryPicker}
          onDone={closeGalleryConfirm}
        />
      )}

      {cameraSubject !== null && (
        <CameraScanScreen subject={cameraSubject} onClose={() => setCameraSubject(null)} />
      )}

      {/* POPUP 1: Dedicated Modal for "Scan Animal Now" (Live AI Camera) */}
      <AnimatePresence>
        {isScanCameraOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto overflow-hidden">
            {/* Backdrop scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => setIsScanCameraOpen(false)}
              className="absolute inset-0 bg-gradient-to-t from-[#00241b]/75 to-black/45 backdrop-blur-[3px] cursor-pointer"
            />

            {/* Sheet Container with Drag-to-Dismiss */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragSnapToOrigin={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 250) {
                  setIsScanCameraOpen(false);
                }
              }}
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.6, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.9 }}
              className="relative w-full max-w-[375px] bg-[#fbfcf9] rounded-t-[32px] border-t border-white/80 shadow-[0_-12px_40px_rgba(0,0,0,0.22)] flex flex-col max-h-[88vh] overflow-hidden z-10 pb-6 px-4 touch-none"
            >
              {/* Drag handle pill */}
              <div className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing">
                <motion.div whileTap={{ scaleX: 1.25, backgroundColor: '#aab3ae' }} className="w-12 h-1.5 rounded-full bg-[#d5d8d3]" />
              </div>

              {/* Header bar */}
              <div className="flex items-start justify-between pt-1 pb-1">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#00362a] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <motion.span
                      className="material-symbols-outlined text-[15px]"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      photo_camera
                    </motion.span>
                    {t('aiCameraScan')}
                  </span>
                  <h3 className="text-[16px] text-[#191c1b] font-bold mt-0.5">
                    {t('selectAnimalToScan')}
                  </h3>
                </div>
                <motion.button
                  type="button"
                  aria-label="Close dialog"
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  whileHover={{ rotate: 90 }}
                  onClick={() => setIsScanCameraOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f2f4f0] hover:bg-[#e6e8e4] text-[#404945] hover:text-[#191c1b] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </motion.button>
              </div>

              {/* Instruction text */}
              <p className="text-[11px] text-[#707975] mt-1.5 mb-3">
                {t('chooseAnimalCamera')}
              </p>

              {/* Animals Grid container (3 columns) */}
              <div className="grid grid-cols-3 gap-2.5 mb-1">
                {registeredLivestock.map((item, index) => {
                  const isSelected = selectedCameraAnimal === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 18, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: isSelected ? 1.04 : 1 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 320, delay: 0.1 + index * 0.05 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleCameraAnimalClick(item)}
                      className={`group relative flex flex-col items-center p-2.5 rounded-2xl text-center cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 ${
                        isSelected
                          ? 'border-2 border-[#194d3f] bg-[#f4faf7] shadow-[0_6px_16px_rgba(25,77,63,0.18)]'
                          : 'border border-[#e5e7e3] bg-white shadow-2xs hover:border-[#194d3f] hover:shadow-md'
                      }`}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 14, stiffness: 400 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#194d3f] text-white flex items-center justify-center shadow-sm z-10"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <div className="relative w-14 h-14 mb-1.5">
                        {isSelected &&
                          [0, 1].map((i) => (
                            <motion.span
                              key={i}
                              className="absolute inset-0 rounded-full border border-[#194d3f]/70 pointer-events-none"
                              initial={{ scale: 1, opacity: 0 }}
                              animate={{ scale: [1, 1.5], opacity: [0.45, 0] }}
                              transition={{
                                duration: 2.2,
                                delay: i * 1.1,
                                repeat: Infinity,
                                ease: [0.2, 0.6, 0.35, 1],
                              }}
                            />
                          ))}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#a9c4b2] to-[#7f9d89] flex items-center justify-center text-white shadow-2xs">
                          <motion.span
                            className="text-[28px] leading-none"
                            animate={isSelected ? { rotate: [0, -10, 10, -6, 0] } : { rotate: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            {item.emoji}
                          </motion.span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-[#191c1b] truncate w-full">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#707975] leading-none mt-0.5">
                        {animalSubtitle(item)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* OR Label */}
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#888] uppercase tracking-wider mt-2.5 mb-1.5">
                <div className="flex-1 h-px bg-[#e5e7e3]" />
                {t('or')}
                <div className="flex-1 h-px bg-[#e5e7e3]" />
              </div>

              {/* Scan New / Unregistered Animal Action Card */}
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300, delay: 0.2 + registeredLivestock.length * 0.05 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCameraNewAnimalClick}
                className="group w-full p-2.5 px-3 rounded-2xl bg-white border border-[#e5e7e3] hover:border-[#00362a] hover:shadow-md flex items-center justify-between gap-3 text-left transition-[border-color,box-shadow] shadow-2xs cursor-pointer mb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#b5efda] flex items-center justify-center text-[#00362a] shrink-0">
                    <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#191c1b]">
                      {t('scanNewUnregistered')}
                    </p>
                    <p className="text-[10px] text-[#707975] leading-tight mt-0.5">
                      {t('scanNewDesc')}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#191c1b] text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP 2: Dedicated Modal for "Upload from Gallery" */}
      <AnimatePresence>
        {isUploadGalleryOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto">
            {/* Backdrop scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadGalleryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Sheet Container with Drag-to-Dismiss */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragSnapToOrigin={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 250) {
                  setIsUploadGalleryOpen(false);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-[375px] bg-[#fbfcf9] rounded-t-[32px] border-t border-white/80 shadow-[0_-12px_40px_rgba(0,0,0,0.22)] flex flex-col max-h-[88vh] overflow-hidden z-10 pb-6 px-4 touch-none"
            >
              {/* Drag handle pill */}
              <div className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-[#d5d8d3]" />
              </div>

              {/* Header bar */}
              <div className="flex items-start justify-between pt-1 pb-1">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#00362a] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">photo_library</span>
                    {t('galleryUpload')}
                  </span>
                  <h3 className="text-[16px] text-[#191c1b] font-bold mt-0.5">
                    {t('selectAnimalGallery')}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setIsUploadGalleryOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f2f4f0] hover:bg-[#e6e8e4] text-[#404945] hover:text-[#191c1b] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="p-3.5 overflow-y-auto overscroll-contain">
                <p className="text-[11px] text-[#404945] mb-2.5">
                  {t('chooseAnimalGallery')}
                </p>

                {/* Animals Grid container for Gallery */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {registeredLivestock.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleGalleryAnimalClick(item)}
                      className={`group relative flex flex-col items-center p-2 rounded-2xl bg-white border transition-all active:scale-95 text-center cursor-pointer ${
                        selectedGalleryAnimal === item.id
                          ? 'border-[#00362a] ring-2 ring-[#00362a] bg-[#b5efda]/20'
                          : 'border-[#bfc9c3]/30 hover:border-[#00362a] hover:bg-[#f3f4f2]'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-full p-0.5 mb-1">
                        <div className="w-full h-full rounded-full overflow-hidden shadow-xs">
                          <div className="w-full h-full bg-[#8fa998] flex items-center justify-center text-white">
                              <span className="text-[24px] leading-none">{item.emoji}</span>
                            </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#191c1b] truncate w-full">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-[#404945] leading-none mt-0.5">
                        {animalSubtitle(item)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Divider option for Unregistered Gallery Upload */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-[#bfc9c3]/40 w-full" />
                  <span className="bg-[#f9faf8] px-2.5 text-[9px] font-semibold text-[#404945] uppercase tracking-wider shrink-0">
                    {t('or')}
                  </span>
                </div>

                {/* Upload for New / Unregistered Animal Action */}
                <button
                  type="button"
                  onClick={handleGalleryNewAnimalClick}
                  className="w-full p-2.5 rounded-full bg-white border border-dashed border-[#00362a]/50 hover:border-[#00362a] hover:bg-[#b5efda]/20 flex items-center justify-between gap-2.5 text-left transition-all group active:scale-[0.99] shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#b5efda] flex items-center justify-center text-[#00362a] shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-[18px]">
                        drive_folder_upload
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#191c1b]">
                        {t('uploadNewUnregistered')}
                      </p>
                      <p className="text-[9px] text-[#404945]">
                        {t('uploadNewDesc')}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#00362a] text-[16px] group-hover:translate-x-0.5 transition-transform pr-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
