import React from 'react';
import { useTranslation } from './LanguageContext';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
    const { language, setLanguage } = useTranslation();

    return (
        <div
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
        >
            <button
                type="button"
                onClick={() => setLanguage('uk')}
                style={{
                    background: language === 'uk' ? 'linear-gradient(135deg, #0057b7 0%, #ffd700 100%)' : 'transparent',
                    color: language === 'uk' ? '#ffffff' : '#aaaaaa',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '3px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textShadow: language === 'uk' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                }}
                title="Українська"
            >
                🇺🇦 UA
            </button>
            <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                    background: language === 'en' ? 'linear-gradient(135deg, #c8102e 0%, #012169 100%)' : 'transparent',
                    color: language === 'en' ? '#ffffff' : '#aaaaaa',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '3px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textShadow: language === 'en' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                }}
                title="English"
            >
                🇬🇧 EN
            </button>
        </div>
    );
};