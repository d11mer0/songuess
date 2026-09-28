import { useState } from 'react';
import Button from '../../UI/Button/Button';
import RoomShareModal from './RoomShareModal';
import { FaQrcode, FaGamepad, FaCopy, FaCheck } from 'react-icons/fa';
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
                <div className={styles.headerLeft}>
                    <h3 className={styles.headerTitle}>
                        <FaGamepad className={styles.gamepadIcon} />
                        <span>{t('gameplay.roomTitle')}</span>
                    </h3>
                    {shortCode && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                onClick={handleCopyCode}
                                title={t('lobby.clickToCopy')}
                                className={styles.codeButton}
                            >
                                <span className={styles.codeLabel}>
                                    {t('gameplay.roomCode')}:
                                </span>
                                <span className={styles.codeValue}>
                                    {shortCode}
                                </span>
                                <span className={styles.codeIcon}>
                                    {copied ? <FaCheck /> : <FaCopy />}
                                </span>
                            </button>
                            {copied && (
                                <span className={styles.copiedBadge}>
                                    {t('shareModal.codeCopied')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <Button
                        variant="primary"
                        onClick={() => setIsShareOpen(true)}
                        className={styles.headerBtn}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaQrcode /> {t('gameplay.qrAndCode')}
                        </span>
                    </Button>
                    <Button
                        variant={showPlayers ? 'secondary' : 'neutral'}
                        onClick={togglePlayers}
                        aria-expanded={showPlayers}
                        aria-controls="players-section"
                        className={styles.headerBtn}
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
