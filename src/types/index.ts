export type Language = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export type DeviceType = 'iphone' | 'pixel' | 'tablet' | 'responsive';
