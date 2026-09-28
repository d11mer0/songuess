import React from 'react';
import { useTranslation } from './LanguageContext';

const UkraineFlag = () => (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ borderRadius: '2px', verticalAlign: '-1px', marginRight: '5px', flexShrink: 0 }}>
        <rect width="16" height="5.5" fill="#0057B7" />
        <rect y="5.5" width="16" height="5.5" fill="#FFD700" />
    </svg>
);

const UkFlag = () => (
    <svg width="16" height="11" viewBox="0 0 60 30" style={{ borderRadius: '2px', verticalAlign: '-1px', marginRight: '5px', flexShrink: 0 }}>
        <clipPath id="uk_flag_clip">
            <rect width="60" height="30" rx="2" />
        </clipPath>
        <g clipPath="url(#uk_flag_clip)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="7"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </g>
    </svg>
);

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
    const { language, setLanguage } = useTranslation();

    return (
        <div
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(28, 22, 44, 0.85)',
                borderRadius: '24px',
                padding: '3px',
                border: '1.5px solid rgba(155, 93, 229, 0.35)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4), inset 0 0 8px rgba(155, 93, 229, 0.1)',
            }}
        >
            <button
                type="button"
                onClick={() => setLanguage('uk')}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: language === 'uk' ? 'linear-gradient(135deg, rgba(0, 87, 183, 0.9) 0%, rgba(255, 215, 0, 0.9) 100%)' : 'transparent',
                    color: language === 'uk' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    border: language === 'uk' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: language === 'uk' ? '0 0 12px rgba(0, 243, 255, 0.4)' : 'none',
                    textShadow: language === 'uk' ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    whiteSpace: 'nowrap',
                }}
                title="Українська"
            >
                <UkraineFlag /> UA
            </button>
            <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: language === 'en' ? 'linear-gradient(135deg, rgba(200, 16, 46, 0.9) 0%, rgba(1, 33, 105, 0.9) 100%)' : 'transparent',
                    color: language === 'en' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    border: language === 'en' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: language === 'en' ? '0 0 12px rgba(241, 91, 181, 0.4)' : 'none',
                    textShadow: language === 'en' ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    whiteSpace: 'nowrap',
                }}
                title="English"
            >
                <UkFlag /> EN
            </button>
        </div>
    );
};