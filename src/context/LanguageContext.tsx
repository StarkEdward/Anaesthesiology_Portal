import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'mr';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('mr'); // Default to Marathi

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'mr' ? 'en' : 'mr');
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
