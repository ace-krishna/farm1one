import React, { useState } from 'react';
import { StitchHomeScreen } from '../screens/StitchHomeScreen';
import { RegisterAnimalScreen } from '../screens/RegisterAnimalScreen';
import { VaccinationScreen } from '../screens/VaccinationScreen';

export const ExpoGoShell: React.FC = () => {
  const [screen, setScreen] = useState<'home' | 'register' | 'vaccination'>('home');
  return (
    <div className="min-h-[100dvh] w-full bg-[#e8ece7] flex items-center justify-center sm:py-4 selection:bg-emerald-200 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Phone Screen Container with authentic 375px mobile viewport */}
      <div 
        className="w-full sm:max-w-[375px] h-[100dvh] sm:h-[812px] bg-[#f9faf8] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] overflow-clip flex flex-col relative select-none isolate"
      >
        {screen === 'register' ? (
          <RegisterAnimalScreen onClose={() => setScreen('home')} />
        ) : screen === 'vaccination' ? (
          <VaccinationScreen onBack={() => setScreen('home')} />
        ) : (
          <StitchHomeScreen onAddAnimal={() => setScreen('register')} onOpenVaccination={() => setScreen('vaccination')} />
        )}
      </div>
    </div>
  );
};
