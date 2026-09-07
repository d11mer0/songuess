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

    return (
        <>
            <div className={styles.headerRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h3 className={styles.title}>{t('gameplay.roomNumber')}{roomId}</h3>
                    {shortCode && (
                        <span style={{
                            background: 'rgba(0, 243, 255, 0.15)',
                            border: '1px solid #00f3ff',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#00f3ff',
                            letterSpacing: '1px'
                        }}>
                            {t('gameplay.roomCode')}: {shortCode}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant="primary"
                        onClick={() => setIsShareOpen(true)}
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