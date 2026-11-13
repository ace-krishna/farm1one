import React from 'react';
import { StitchHomeScreen } from '../screens/StitchHomeScreen';

export const ExpoGoShell: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#e8ece7] flex items-center justify-center sm:py-4 selection:bg-emerald-200 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Phone Screen Container with authentic 375px mobile viewport */}
      <div 
        className="w-full sm:max-w-[375px] h-screen sm:h-[812px] bg-[#f9faf8] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col relative select-none border border-black/5"
      >
        <StitchHomeScreen />
      </div>
    </div>
  );
};
