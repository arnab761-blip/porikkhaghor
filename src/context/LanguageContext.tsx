import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations, type Language } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  toLangNumber: (val: number | string | null | undefined) => string;
  formatDate: (timestampOrDate: any, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('site_language');
    return (saved === 'en' || saved === 'bn') ? saved : 'bn';
  });

  useEffect(() => {
    localStorage.setItem('site_language', language);
    // Update html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'bn' ? 'en' : 'bn');
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] as Record<string, string>;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Bengali if exists
    const bnDict = translations['bn'] as Record<string, string>;
    if (bnDict && bnDict[key]) {
      return bnDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const toLangNumber = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return language === 'bn' ? '০' : '0';
    if (language === 'en') {
      // In English, ensure standard Arabic digits 0-9
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      let str = val.toString();
      bnDigits.forEach((d, idx) => {
        str = str.replace(new RegExp(d, 'g'), idx.toString());
      });
      return str;
    } else {
      // In Bengali, ensure Bengali digits ০-৯
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return val.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
    }
  };

  const formatDate = (timestampOrDate: any, customOptions?: Intl.DateTimeFormatOptions): string => {
    if (!timestampOrDate) return language === 'bn' ? 'অজানা সময়' : 'Unknown date';
    const date = timestampOrDate.toDate 
      ? timestampOrDate.toDate() 
      : timestampOrDate instanceof Date 
      ? timestampOrDate 
      : new Date(timestampOrDate);

    const defaultOptions: Intl.DateTimeFormatOptions = customOptions || {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const locale = language === 'bn' ? 'bn-BD' : 'en-US';
    return date.toLocaleDateString(locale, defaultOptions);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, toLangNumber, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
