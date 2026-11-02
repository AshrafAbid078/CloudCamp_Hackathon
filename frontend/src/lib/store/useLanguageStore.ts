'use client';

import { create } from 'zustand';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: (typeof window !== 'undefined' && (localStorage.getItem('meridian_lang') as Language)) || 'en',
  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meridian_lang', lang);
    }
    set({ language: lang });
  },
  toggleLanguage: () => {
    const current = get().language;
    const next: Language = current === 'en' ? 'bn' : 'en';
    if (typeof window !== 'undefined') {
      localStorage.setItem('meridian_lang', next);
    }
    set({ language: next });
  },
  t: (key: TranslationKey): string => {
    const lang = get().language;
    return translations[lang]?.[key] || translations.en[key] || key;
  },
}));

