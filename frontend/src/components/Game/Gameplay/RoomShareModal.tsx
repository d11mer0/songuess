import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import styles from './RoomShareModal.module.css';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { useTranslation } from '../../../i18n/LanguageContext';

interface RoomShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    shortCode?: string;
}

const RoomShareModal: React.FC<RoomShareModalProps> = ({ isOpen, onClose, roomId, shortCode }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

    const displayCode = (shortCode || roomId).toUpperCase().substring(0, 4);
    const shareUrl = `${window.location.origin}/game?join=${shortCode || roomId}`;

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, shareUrl, {
                width: 180,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            }).catch((err) => console.error('Error generating QR code', err));
        }
    }, [isOpen, shareUrl]);

    if (!isOpen) return null;

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2500);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <h2 className={styles.title}>📱 {t('shareModal.title')}</h2>
                <p className={styles.subtitle}>{t('shareModal.subtitle')}</p>

                {/* 4-значний код */}
                <div className={styles.codeSection}>
                    <div className={styles.codeLabel}>{t('gameplay.roomCode')}:</div>
                    <div className={styles.codeDisplay}>
                        {displayCode.split('').map((char, i) => (
                            <span key={i} className={styles.codeChar}>
                                {char}
                            </span>
                        ))}
                    </div>
                    <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(displayCode, 'code')}
                    >
                        {copiedType === 'code' ? (
                            <>
                                <FaCheck /> {t('shareModal.codeCopied')}
                            </>
                        ) : (
                            <>
                                <FaCopy /> {t('shareModal.copyCode')}
                            </>
                        )}
                    </button>
                </div>

                {/* QR-код */}
                <div className={styles.qrContainer}>
                    <div className={styles.qrWrapper}>
                        <canvas ref={canvasRef} className={styles.qrCanvas} />
                    </div>
                    <div className={styles.qrHint}>📷 {t('shareModal.scanQr')}</div>
                </div>

                {/* Пряме посилання */}
                <div className={styles.linkSection}>
                    <input className={styles.linkInput} readOnly value={shareUrl} />
                    <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(shareUrl, 'link')}
                        aria-label={t('shareModal.copyLink')}
                    >
                        {copiedType === 'link' ? <FaCheck /> : <FaCopy />}
                    </button>
                </div>
                {copiedType === 'link' && (
                    <div className={styles.copiedToast}>{t('shareModal.linkCopied')}</div>
                )}
            </div>
        </div>
    );
};

export default RoomShareModal;