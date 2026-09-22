import { useState } from 'react';
import Button from '../../UI/Button/Button';
import RoomShareModal from './RoomShareModal';
import { FaQrcode } from 'react-icons/fa';
import styles from '../../../pages/Game/Gameplay.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

type GameplayHeaderProps = {
    roomId: string;
    shortCode?: string;
    showPlayers: boolean;
    togglePlayers: () => void;
};

const GameplayHeader = ({ roomId, shortCode, showPlayers, togglePlayers }: GameplayHeaderProps) => {
    const { t } = useTranslation();
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (!shortCode) return;
        navigator.clipboard.writeText(shortCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div className={styles.headerRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <h3 className={styles.title}>🎮 {t('gameplay.roomTitle')}</h3>
                    {shortCode && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                onClick={handleCopyCode}
                                title={t('lobby.clickToCopy')}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,243,255,0.15), rgba(139,92,246,0.15))',
                                    border: '1.5px solid #00f3ff',
                                    borderRadius: '8px',
                                    padding: '5px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,243,255,0.25), rgba(139,92,246,0.25))')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,243,255,0.15), rgba(139,92,246,0.15))')}
                            >
                                <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 500 }}>
                                    {t('gameplay.roomCode')}:
                                </span>
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: '800',
                                    color: '#00f3ff',
                                    letterSpacing: '2px',
                                    fontFamily: 'monospace',
                                }}>
                                    {shortCode}
                                </span>
                                <span style={{ fontSize: '13px' }}>
                                    {copied ? '✅' : '📋'}
                                </span>
                            </button>
                            {copied && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-28px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(0,0,0,0.8)',
                                    color: '#00f3ff',
                                    fontSize: '12px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                }}>
                                    {t('shareModal.codeCopied')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <Button
                        variant="primary"
                        onClick={() => setIsShareOpen(true)}
                        style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '14px' }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaQrcode /> {t('gameplay.qrAndCode')}
                        </span>
                    </Button>
                    <Button
                        variant="neutral"
                        onClick={togglePlayers}
                        aria-expanded={showPlayers}
                        aria-controls="players-section"
                        style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '14px' }}
                    >
                        {showPlayers ? t('gameplay.hidePlayers') : t('gameplay.showPlayers')}
                    </Button>
                </div>
            </div>
            <RoomShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                roomId={roomId}
                shortCode={shortCode}
            />
        </>
    );
};

export default GameplayHeader;
