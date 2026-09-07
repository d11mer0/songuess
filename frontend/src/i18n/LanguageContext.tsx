import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationDictionary } from './types';
import { uk } from './locales/uk';
import { en } from './locales/en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, TranslationDictionary> = { uk, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('songuess_lang');
        return (saved === 'en' || saved === 'uk') ? saved : 'uk';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('songuess_lang', lang);
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const t = (path: string, params?: Record<string, string | number>): string => {
        const parts = path.split('.');
        let current: any = dictionaries[language];

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                // Fallback to UK
                let fallback: any = dictionaries.uk;
                for (const fbPart of parts) {
                    if (fallback && typeof fallback === 'object' && fbPart in fallback) {
                        fallback = fallback[fbPart];
                    } else {
                        return path;
                    }
                }
                current = fallback;
                break;
            }
        }

        if (typeof current !== 'string') {
            return path;
        }

        let result = current;
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
            });
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};