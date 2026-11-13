import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

interface AnimalItem {
  id: string;
  name: string;
  breed: string;
  tag: string;
  image?: string;
  icon?: string;
}

const registeredLivestock: AnimalItem[] = [
  {
    id: 'ani_02',
    name: 'Gauri',
    breed: 'Gir',
    tag: '#02',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDl_WqgtKL62C3Dz6NVVveO_6YkfvN-UQwgcN2NmNB-hCkXleZ8MUl_SXICka1nYISG24SsZNtVXkQ7VhCSXNq58idhZrDh2LJUV8KvraAPcJD0X-z3BKiLMBU6qosR0yZiRZ97iTnFQaXPDYWArX86gaF3SGizATW8NF4SUcq7QiY3oe_eDlnOTLmx7E3qy9SZzfdZxfLLxzFx-VoGedoooBhGjsSO3Xvw-BE78AA03mYeNf7xx1CIvbNecnnMpzChrg',
  },
  {
    id: 'ani_01',
    name: 'Nandi',
    breed: 'Bull',
    tag: '#01',
    icon: 'cruelty_free',
  },
  {
    id: 'ani_03',
    name: 'Lakshmi',
    breed: 'Cow',
    tag: '#03',
    icon: 'sound_detection_dog_barking',
  },
  {
    id: 'ani_04',
    name: 'Bheema',
    breed: 'Cow',
    tag: '#04',
    icon: 'agriculture',
  },
];

export const StitchHomeScreen: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  // Modals state
  const [isScanCameraOpen, setIsScanCameraOpen] = useState(false);
  const [isUploadGalleryOpen, setIsUploadGalleryOpen] = useState(false);
  const [selectedCameraAnimal, setSelectedCameraAnimal] = useState<string | null>('ani_01');
  const [selectedGalleryAnimal, setSelectedGalleryAnimal] = useState<string | null>('ani_01');
  const [cameraFeedbackText, setCameraFeedbackText] = useState<string | null>(null);
  const [galleryFeedbackText, setGalleryFeedbackText] = useState<string | null>(null);

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
    setCameraFeedbackText(`Starting camera scanner for ${animal.name}...`);
    setTimeout(() => {
      setIsScanCameraOpen(false);
      setCameraFeedbackText(null);
    }, 1100);
  };

  const handleCameraNewAnimalClick = () => {
    setSelectedCameraAnimal('new');
    setCameraFeedbackText('Starting camera for New / Unregistered Animal...');
    setTimeout(() => {
      setIsScanCameraOpen(false);
      setCameraFeedbackText(null);
    }, 1100);
  };

  const handleGalleryAnimalClick = (animal: AnimalItem) => {
    setSelectedGalleryAnimal(animal.id);
    setGalleryFeedbackText(`Selecting gallery image for ${animal.name}...`);
    setTimeout(() => {
      setIsUploadGalleryOpen(false);
      setGalleryFeedbackText(null);
    }, 1100);
  };

  const handleGalleryNewAnimalClick = () => {
    setSelectedGalleryAnimal('new');
    setGalleryFeedbackText('Opening photo library for New / Unregistered Animal...');
    setTimeout(() => {
      setIsUploadGalleryOpen(false);
      setGalleryFeedbackText(null);
    }, 1100);
  };

  const handleDockItemClick = (index: number, label: string) => {
    setActiveDockIndex(index);
    if (index !== 0) {
      setDockNotification(`${label} screen will be added when you provide its Stitch code.`);
      setTimeout(() => setDockNotification(null), 2500);
    }
  };

  return (
    <div className="bg-[#f9faf8] text-[#191c1b] h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative select-none antialiased overflow-hidden">
      {/* HEADER: FARM FAMILY | Home + Language Toggle */}
      <header className="shrink-0 w-full z-30 pt-2 pb-1.5 bg-[#f9faf8] px-3.5">
        <div className="flex items-center justify-between">
          {/* Brand Icon & Heading */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#28493d] flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                agriculture
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#404945] uppercase tracking-wider leading-none">
                {t('farmFamily')}
              </span>
              <h1 className="text-[17px] font-bold text-[#191c1b] leading-tight mt-0.5">
                {t('home')}
              </h1>
            </div>
          </div>

          {/* Tri-Lingual Language Toggle Pill */}
          <div className="inline-flex p-0.5 bg-[#eceee9] rounded-full items-center shadow-inner">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                language === 'en'
                  ? 'font-bold bg-[#00362a] text-white shadow-sm'
                  : 'font-semibold text-[#404945] hover:text-[#00362a]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                language === 'hi'
                  ? 'font-bold bg-[#00362a] text-white shadow-sm'
                  : 'font-semibold text-[#404945] hover:text-[#00362a]'
              }`}
            >
              <span style={{ letterSpacing: '0.3px' }}>हिंदी</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                language === 'mr'
                  ? 'font-bold bg-[#00362a] text-white shadow-sm'
                  : 'font-semibold text-[#404945] hover:text-[#00362a]'
              }`}
            >
              <span style={{ letterSpacing: '0.3px' }}>मराठी</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto flex flex-col pt-1 pb-20 px-3.5 gap-3.5 scrollbar-none">
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
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full bg-white border border-stone-200/80 shadow-2xs text-left hover:bg-[#f3f4f2] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#b5efda] flex items-center justify-center text-[#002018] shrink-0">
                <span className="material-symbols-outlined text-[17px]">pets</span>
              </div>
              <div className="overflow-hidden pr-2">
                <p className="text-[11px] font-bold text-[#191c1b] truncate leading-tight">
                  {t('myCattle')}
                </p>
                <p className="text-[9px] text-[#404945] truncate mt-0.5">
                  {t('animalsRegistered')}
                </p>
              </div>
            </motion.button>

            {/* Mandis & Rates Chip (Full Pill) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full bg-white border border-stone-200/80 shadow-2xs text-left hover:bg-[#f3f4f2] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#2f1500] shrink-0">
                <span className="material-symbols-outlined text-[17px]">trending_up</span>
              </div>
              <div className="overflow-hidden pr-2">
                <p className="text-[11px] font-bold text-[#191c1b] truncate leading-tight">
                  {t('mandisAndRates')}
                </p>
                <p className="text-[9px] text-[#404945] truncate mt-0.5">
                  {t('livePuneMarket')}
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
              <span>{t('viewAll4')}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>

          {/* Horizontal Animal Avatars */}
          <div className="flex overflow-x-auto scrollbar-none gap-2.5 py-0.5 px-0.5">
            {/* Gauri */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                setSelectedCameraAnimal('ani_02');
                setIsScanCameraOpen(true);
              }}
              className="flex flex-col items-center shrink-0 text-center cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center shadow-xs">
                <img
                  alt="Gauri Gir Cow"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl_WqgtKL62C3Dz6NVVveO_6YkfvN-UQwgcN2NmNB-hCkXleZ8MUl_SXICka1nYISG24SsZNtVXkQ7VhCSXNq58idhZrDh2LJUV8KvraAPcJD0X-z3BKiLMBU6qosR0yZiRZ97iTnFQaXPDYWArX86gaF3SGizATW8NF4SUcq7QiY3oe_eDlnOTLmx7E3qy9SZzfdZxfLLxzFx-VoGedoooBhGjsSO3Xvw-BE78AA03mYeNf7xx1CIvbNecnnMpzChrg"
                />
              </div>
              <span className="text-[11px] font-bold text-[#191c1b] mt-1 truncate w-14">
                Gauri
              </span>
              <span className="text-[9px] text-[#404945]">Gir • #02</span>
            </motion.button>

            {/* Nandi */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                setSelectedCameraAnimal('ani_01');
                setIsScanCameraOpen(true);
              }}
              className="flex flex-col items-center shrink-0 text-center cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[24px]">cruelty_free</span>
              </div>
              <span className="text-[11px] font-bold text-[#191c1b] mt-1 truncate w-14">
                Nandi
              </span>
              <span className="text-[9px] text-[#404945]">Bull • #01</span>
            </motion.button>

            {/* Lakshmi */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                setSelectedCameraAnimal('ani_03');
                setIsScanCameraOpen(true);
              }}
              className="flex flex-col items-center shrink-0 text-center cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[24px]">
                  sound_detection_dog_barking
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#191c1b] mt-1 truncate w-14">
                Lakshmi
              </span>
              <span className="text-[9px] text-[#404945]">Cow • #03</span>
            </motion.button>

            {/* Bheema */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                setSelectedCameraAnimal('ani_04');
                setIsScanCameraOpen(true);
              }}
              className="flex flex-col items-center shrink-0 text-center cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[24px]">agriculture</span>
              </div>
              <span className="text-[11px] font-bold text-[#191c1b] mt-1 truncate w-14">
                Bheema
              </span>
              <span className="text-[9px] text-[#404945]">Cow • #04</span>
            </motion.button>
          </div>

          {/* Register / Add Farm Animal Card (Full Pill Container) */}
          <div className="mt-2.5">
            <div className="p-1.5 pl-2.5 pr-2 rounded-full bg-white border border-stone-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#b5efda] flex items-center justify-center text-[#002018] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add</span>
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
                className="px-3.5 py-1.5 rounded-full bg-[#00362a] text-white text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs cursor-pointer hover:bg-[#00261d] transition-all"
              >
                <span>{t('addAnimalBtn')}</span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRIMARY HERO CARD — AI ANIMAL HEALTH SCAN */}
        <section>
          <div
            className="relative overflow-hidden rounded-[28px] p-4 text-white bg-gradient-to-br from-[#265345] via-[#1a4437] to-[#123329] shadow-sm border border-white/10"
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#b5efda] text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#99d2be] animate-pulse" />
                {t('instantDiagnosticAi')}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[17px]">
                  center_focus_strong
                </span>
              </div>
            </div>

            <h2 className="text-[19px] text-white leading-tight font-bold font-['Plus_Jakarta_Sans']">
              {t('aiAnimalHealthScan')}
            </h2>
            <p className="text-[11px] text-white/85 leading-relaxed mt-1 mb-3.5">
              {t('aiScanDesc')}
            </p>

            {/* Liquid Glass Buttons (Pill Format) */}
            <div className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="scanAnimalNowBtn"
                onClick={() => setIsScanCameraOpen(true)}
                className="w-full h-10 rounded-full text-[13px] flex items-center justify-center gap-1.5 bg-white text-[#191c1b] font-bold shadow-xs hover:bg-white/95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#191c1b]">
                  photo_camera
                </span>
                <span>{t('scanAnimalNow')}</span>
                <span className="material-symbols-outlined text-[15px] ml-0.5 text-[#191c1b]">
                  arrow_forward
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                id="uploadFromGalleryBtn"
                onClick={() => setIsUploadGalleryOpen(true)}
                className="w-full h-10 rounded-full text-[13px] flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/25 font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-white">
                  photo_library
                </span>
                <span>{t('uploadFromGallery')}</span>
                <span className="material-symbols-outlined text-[15px] ml-0.5 text-white">
                  arrow_forward
                </span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* SECTION 4: FARM SERVICES — Essential Updates */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#404945] font-bold uppercase tracking-wider">
                {t('farmServices')}
              </span>
              <h3 className="text-[16px] text-[#191c1b] font-bold leading-tight mt-0.5">
                {t('essentialUpdates')}
              </h3>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* i-Learning & Guides (Deep Rounded Card with Pill Button) */}
            <div className="w-full rounded-[28px] bg-white border border-stone-200/80 shadow-2xs p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#dbebff] flex items-center justify-center text-[#004971] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#004971] text-white text-[10px] font-bold">
                    {t('lessons12')}
                  </span>
                </div>
                <h4 className="text-[14px] text-[#191c1b] font-bold mb-0.5">
                  {t('iLearning')}
                </h4>
                <p className="text-[11px] text-[#404945] leading-normal">
                  {t('iLearningDesc')}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full py-2 rounded-full bg-[#f2f4f1] hover:bg-[#e8eae6] text-[#191c1b] text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{t('watchModules')}</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Vaccination Schedule (Deep Rounded Card with Pill Button) */}
            <div className="w-full rounded-[28px] bg-white border border-stone-200/80 shadow-2xs p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#ffe8dc] flex items-center justify-center text-[#904d00] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">vaccines</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">schedule</span>{' '}
                    {t('dueSoon1')}
                  </span>
                </div>
                <h4 className="text-[14px] text-[#191c1b] font-bold mb-0.5">
                  {t('vaccinationSchedule')}
                </h4>
                <p className="text-[11px] text-[#404945] leading-normal">
                  {t('vaccinationDesc')}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full py-2 rounded-full bg-[#8c4a00] hover:bg-[#7a3f00] text-white text-[12px] font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
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
        className="absolute bottom-2 inset-x-3 max-w-[340px] mx-auto z-40 select-none pointer-events-auto"
      >
        <div
          id="liquidGlassDock"
          className="relative w-full rounded-full p-1 transition-all duration-300 flex items-center justify-between"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Home Tab (Pill Active Indicator) */}
          <button
            type="button"
            onClick={() => handleDockItemClick(0, t('home'))}
            className={`group relative flex flex-col items-center justify-center py-1 px-5 rounded-full cursor-pointer transition-all duration-200 ${
              activeDockIndex === 0 ? 'bg-[#d8f3e5] text-[#00362a] font-bold shadow-2xs' : 'text-[#404945] hover:text-[#00362a]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings: activeDockIndex === 0 ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              home
            </span>
            <span className="text-[10px] leading-tight tracking-tight font-bold">
              {t('home')}
            </span>
          </button>

          {/* Marketplace Tab */}
          <button
            type="button"
            onClick={() => handleDockItemClick(1, t('marketplace'))}
            className={`flex-1 group relative flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-200 ${
              activeDockIndex === 1 ? 'bg-[#d8f3e5] text-[#00362a] font-bold shadow-2xs' : 'text-[#404945] hover:text-[#00362a]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings: activeDockIndex === 1 ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              storefront
            </span>
            <span className="text-[10px] leading-tight tracking-tight font-medium">
              {t('marketplace')}
            </span>
          </button>

          {/* Farmer Profile Tab */}
          <button
            type="button"
            onClick={() => handleDockItemClick(2, t('farmerProfile'))}
            className={`flex-1 group relative flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-200 ${
              activeDockIndex === 2 ? 'bg-[#d8f3e5] text-[#00362a] font-bold shadow-2xs' : 'text-[#404945] hover:text-[#00362a]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings: activeDockIndex === 2 ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              account_circle
            </span>
            <span className="text-[10px] leading-tight tracking-tight font-medium">
              {t('farmerProfile')}
            </span>
          </button>
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

      {/* POPUP 1: Dedicated Modal for "Scan Animal Now" (Live AI Camera) */}
      <AnimatePresence>
        {isScanCameraOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto overflow-hidden">
            {/* Backdrop scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScanCameraOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
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
                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    {t('aiCameraScan')}
                  </span>
                  <h3 className="text-[16px] text-[#191c1b] font-bold mt-0.5">
                    {t('selectAnimalToScan')}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setIsScanCameraOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f2f4f0] hover:bg-[#e6e8e4] text-[#404945] hover:text-[#191c1b] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Instruction text */}
              <p className="text-[11px] text-[#707975] mt-1.5 mb-3">
                {t('chooseAnimalCamera')}
              </p>

              {/* Animals Grid container (3 columns) */}
              <div className="grid grid-cols-3 gap-2.5 mb-1">
                {registeredLivestock.map((item) => {
                  const isSelected = selectedCameraAnimal === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCameraAnimalClick(item)}
                      className={`group relative flex flex-col items-center p-2.5 rounded-2xl transition-all active:scale-95 text-center cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#194d3f] bg-[#f4faf7] shadow-xs'
                          : 'border border-[#e5e7e3] bg-white shadow-2xs hover:border-[#194d3f]'
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#8fa998] flex items-center justify-center text-white mb-1.5 shadow-2xs">
                        {item.image ? (
                          <img
                            alt={item.name}
                            src={item.image}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[28px]">
                            {item.icon}
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-[#191c1b] truncate w-full">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#707975] leading-none mt-0.5">
                        {item.breed} • {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* OR Label */}
              <div className="text-right text-[10px] font-bold text-[#888] uppercase tracking-wider pr-1.5 mt-2 mb-1.5">
                {t('or')}
              </div>

              {/* Scan New / Unregistered Animal Action Card */}
              <button
                type="button"
                onClick={handleCameraNewAnimalClick}
                className="w-full p-2.5 px-3 rounded-2xl bg-white border border-[#e5e7e3] hover:border-[#00362a] flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-2xs cursor-pointer mb-1"
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
                <span className="material-symbols-outlined text-[#191c1b] text-[18px]">
                  arrow_forward
                </span>
              </button>

              {/* Selection Notification Banner */}
              {cameraFeedbackText && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 p-2 rounded-full bg-[#00362a] text-white flex items-center justify-between px-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      refresh
                    </span>
                    <span className="text-[11px] font-semibold">
                      {cameraFeedbackText}
                    </span>
                  </div>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {t('ready')}
                  </span>
                </motion.div>
              )}
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
                          {item.image ? (
                            <img
                              alt={item.name}
                              src={item.image}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#8fa998] flex items-center justify-center text-white">
                              <span className="material-symbols-outlined text-[24px]">
                                {item.icon}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#191c1b] truncate w-full">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-[#404945] leading-none mt-0.5">
                        {item.breed} • {item.tag}
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

                {/* Selection Notification Banner */}
                {galleryFeedbackText && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2.5 p-2 rounded-full bg-[#00362a] text-white flex items-center justify-between px-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        refresh
                      </span>
                      <span className="text-[11px] font-semibold">
                        {galleryFeedbackText}
                      </span>
                    </div>
                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {t('ready')}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
