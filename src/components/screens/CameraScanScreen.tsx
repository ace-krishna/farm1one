import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

const TEXT = {
  en: { gallery: 'Gallery', flip: 'Flip', hint: 'Please click the picture of the affected area', torch: 'Torch', done: 'Done', retake: 'Retake', reselect: 'Reselect', use: 'Use Photo', preview: 'Preview', noCam: 'Live camera unavailable — tap the shutter to open your camera app', scanning: 'Scanning' },
  hi: { gallery: 'गैलरी', flip: 'पलटें', hint: 'कृपया प्रभावित हिस्से की तस्वीर लें', torch: 'टॉर्च', done: 'हो गया', retake: 'फिर से लें', reselect: 'फिर से चुनें', use: 'फोटो उपयोग करें', preview: 'पूर्वावलोकन', noCam: 'कैमरा उपलब्ध नहीं — डेमो व्यूफाइंडर दिख रहा है', scanning: 'स्कैन' },
  mr: { gallery: 'गॅलरी', flip: 'फिरवा', hint: 'कृपया बाधित भागाचा फोटो घ्या', torch: 'टॉर्च', done: 'झाले', retake: 'पुन्हा घ्या', reselect: 'पुन्हा निवडा', use: 'फोटो वापरा', preview: 'पूर्वावलोकन', noCam: 'कॅमेरा उपलब्ध नाही — डेमो व्ह्यूफाइंडर दाखवत आहे', scanning: 'स्कॅन' },
} as const;

interface CameraScanScreenProps {
  /** Name of the animal being scanned (or a "new animal" label). */
  subject?: string;
  onClose: () => void;
  /** Called with the confirmed photo (data URL). */
  onUsePhoto?: (photo: string) => void;
}

const FONT = "font-['Plus_Jakarta_Sans',sans-serif]";

/** Rule-of-thirds grid shared by the viewfinder and the preview. */
const GridOverlay: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none opacity-20">
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-neutral-600">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className={`border-neutral-600 ${i % 3 !== 2 ? 'border-r' : ''} ${i < 6 ? 'border-b' : ''}`} />
      ))}
    </div>
  </div>
);

const HomeBar: React.FC = () => (
  <div className="w-full flex justify-center pb-1 pt-1">
    <div className="w-32 h-1 bg-neutral-700 rounded-full" />
  </div>
);

interface PhotoConfirmScreenProps {
  photo: string;
  /** Which label the outlined left button shows. */
  secondary: 'retake' | 'reselect';
  onSecondary: () => void;
  onDone: () => void;
}

/** Full-screen photo preview with a Retake/Reselect + Done action row. */
export const PhotoConfirmScreen: React.FC<PhotoConfirmScreenProps> = ({ photo, secondary, onSecondary, onDone }) => {
  const { language } = useLanguage();
  const T = TEXT[language as 'en' | 'hi' | 'mr'] ?? TEXT.en;
  const secondaryLabel = T[secondary];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`absolute inset-0 z-[60] bg-black flex flex-col p-4 text-white ${FONT}`}
    >
      <div className="h-7" />
      <motion.main
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex-1 w-full bg-neutral-900 border border-neutral-700/80 rounded-[32px] overflow-hidden shadow-inner"
      >
        <img src={photo} alt={T.preview} className="absolute inset-0 w-full h-full object-cover" />
        <GridOverlay />
      </motion.main>

      <footer className="w-full pt-4 pb-3 px-3 flex justify-center">
        <div className="w-full max-w-[380px] flex items-center justify-center gap-3 px-2">
          <motion.button
            type="button"
            aria-label={secondaryLabel}
            whileTap={{ scale: 0.94 }}
            onClick={onSecondary}
            className="flex-1 py-3 px-6 rounded-full border border-white/20 bg-neutral-900/80 hover:border-neutral-400 text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {secondaryLabel}
          </motion.button>
          <motion.button
            type="button"
            aria-label={T.done}
            whileTap={{ scale: 0.94 }}
            onClick={onDone}
            className="flex-1 py-3 px-6 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            {T.done}
          </motion.button>
        </div>
      </footer>
      <HomeBar />
    </motion.div>
  );
};

/** Draws a placeholder "photo" so the flow can be tested without a camera. */
const makeDemoPhoto = (): string => {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 1200;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, 1200);
  sky.addColorStop(0, '#bfe0f0');
  sky.addColorStop(0.55, '#e8f1e0');
  sky.addColorStop(0.55, '#7fa66a');
  sky.addColorStop(1, '#4d7a45');
  g.fillStyle = sky;
  g.fillRect(0, 0, 900, 1200);
  g.font = '320px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('🐮', 450, 640);
  return c.toDataURL('image/jpeg', 0.9);
};

export const CameraScanScreen: React.FC<CameraScanScreenProps> = ({ subject, onClose, onUsePhoto }) => {
  const { language } = useLanguage();
  const T = TEXT[language as 'en' | 'hi' | 'mr'] ?? TEXT.en;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nativeCamRef = useRef<HTMLInputElement>(null);

  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null = starting
  const [flashOn, setFlashOn] = useState(false);
  const [flashBurst, setFlashBurst] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [lastThumb, setLastThumb] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Start / restart the camera whenever we're on the viewfinder.
  useEffect(() => {
    if (photo) return;
    let cancelled = false;
    setHasCamera(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
      })
      .catch(() => !cancelled && setHasCamera(false));
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, photo]);

  // Torch (only works on devices that support it; the toggle is harmless elsewhere).
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    (track as any)?.applyConstraints?.({ advanced: [{ torch: flashOn }] }).catch(() => {});
  }, [flashOn, hasCamera]);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capture = useCallback(() => {
    // No live camera (e.g. page isn't HTTPS): open the phone's native camera app instead.
    if (!hasCamera && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      nativeCamRef.current?.click();
      return;
    }
    let dataUrl: string;
    const v = videoRef.current;
    if (hasCamera && v && v.videoWidth) {
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const g = c.getContext('2d')!;
      if (facing === 'user') {
        g.translate(c.width, 0);
        g.scale(-1, 1);
      }
      g.drawImage(v, 0, 0);
      dataUrl = c.toDataURL('image/jpeg', 0.9);
    } else {
      dataUrl = makeDemoPhoto();
    }
    navigator.vibrate?.(15);
    setFlashBurst(true);
    setTimeout(() => setFlashBurst(false), 140);
    setLastThumb(dataUrl);
    setTimeout(() => setPhoto(dataUrl), 120);
  }, [hasCamera, facing]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setLastThumb(url);
      setPhoto(url);
    };
    reader.readAsDataURL(file);
  };

  const iconBtn =
    'w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer';

  /* ───────────── Confirmation screen ───────────── */
  if (photo) {
    return (
      <PhotoConfirmScreen
        photo={photo}
        secondary="retake"
        onSecondary={() => setPhoto(null)}
        onDone={() => {
          onUsePhoto?.(photo);
          onClose();
        }}
      />
    );
  }


  /* ───────────── Camera screen ───────────── */
  return (
    <div className={`absolute inset-0 z-[60] bg-black flex flex-col p-2 text-white overflow-hidden ${FONT}`}>
      {/* Viewfinder (fills all space above the controls) */}
      <main className="relative flex-1 w-full bg-neutral-900 border border-neutral-700/80 rounded-[28px] overflow-hidden flex flex-col justify-end p-4 shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${hasCamera ? '' : 'hidden'}`}
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />
        {!hasCamera && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[110px] opacity-10 select-none">🐮</span>
          </div>
        )}
        <GridOverlay />

        {/* Subject + close, overlaid on the viewfinder */}
        <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center">
          {subject ? (
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-neutral-200 max-w-[200px] truncate">
              {subject}
            </span>
          ) : (
            <span />
          )}
          <button type="button" aria-label="Close" className={iconBtn} onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Hint pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-16 left-0 right-0 z-20 flex justify-center pointer-events-none px-4"
        >
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-lg">
            <span className="block text-[10px] font-medium tracking-wider text-white/90 uppercase text-center leading-snug">
              {hasCamera === false ? T.noCam : T.hint}
            </span>
          </div>
        </motion.div>

        {/* Torch */}
        <div className="relative z-10 flex items-center">
          <motion.button
            type="button"
            aria-label="Toggle torch"
            aria-pressed={flashOn}
            whileTap={{ scale: 0.92 }}
            onClick={() => setFlashOn((f) => !f)}
            className={`rounded-full py-2 px-3.5 flex items-center gap-2 border text-xs font-semibold tracking-wider uppercase backdrop-blur-md transition-all duration-200 cursor-pointer ${
              flashOn
                ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                : 'border-white/20 bg-white/10 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{flashOn ? 'flashlight_on' : 'flashlight_off'}</span>
            {T.torch}
          </motion.button>
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="w-full pt-2 pb-1 px-1 flex justify-center">
        <div className="w-full flex items-center justify-around px-2 py-2.5 bg-neutral-950/60 rounded-full border border-neutral-800/80 backdrop-blur-md shadow-2xl">
          {/* Gallery */}
          <div className="flex flex-col items-center justify-center">
            <motion.button
              type="button"
              aria-label={T.gallery}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-full overflow-hidden border border-neutral-700/80 bg-neutral-900/90 flex items-center justify-center text-neutral-200 hover:border-neutral-400 transition-colors shadow-inner cursor-pointer"
            >
              {lastThumb ? (
                <img src={lastThumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[26px]">image</span>
              )}
            </motion.button>
            <span className="text-[10px] font-medium tracking-wider text-neutral-400 mt-1 uppercase">{T.gallery}</span>
          </div>

          {/* Shutter */}
          <motion.button
            type="button"
            aria-label="Capture photo"
            whileTap={{ scale: 0.94 }}
            onClick={capture}
            className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#d9d9d9] p-[2.5px] shadow-[0_0_24px_rgba(255,255,255,0.15)] cursor-pointer"
          >
            <span className="block w-full h-full rounded-full bg-black p-[4px]">
              <motion.span whileTap={{ scale: 0.88, opacity: 0.8 }} className="block w-full h-full rounded-full bg-white" />
            </span>
          </motion.button>

          {/* Flip */}
          <div className="flex flex-col items-center justify-center">
            <motion.button
              type="button"
              aria-label={T.flip}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              className="w-14 h-14 rounded-full border border-neutral-700/80 bg-neutral-900/90 flex items-center justify-center text-neutral-200 hover:border-neutral-400 transition-colors shadow-inner cursor-pointer"
            >
              <motion.span
                className="material-symbols-outlined text-[26px]"
                animate={{ rotate: facing === 'user' ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                flip_camera_ios
              </motion.span>
            </motion.button>
            <span className="text-[10px] font-medium tracking-wider text-neutral-400 mt-1 uppercase">{T.flip}</span>
          </div>
        </div>
      </footer>
      <HomeBar />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
      <input ref={nativeCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFile} />

      {/* Shutter flash */}
      {flashBurst && <div className="absolute inset-0 bg-white z-30" />}
    </div>
  );
};
