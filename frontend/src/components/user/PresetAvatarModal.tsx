import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { PRESET_AVATARS, PresetAvatar } from '../../assets/avatars/presetAvatars';
import { useUpdatePresetAvatarMutation } from '../../store/api/userApi';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../UI/Button/Button';
import styles from './PresetAvatarModal.module.css';
import { FaCheck } from 'react-icons/fa6';

interface PresetAvatarModalProps {
    show: boolean;
    onClose: () => void;
    currentAvatar?: string;
}

export const PresetAvatarModal: React.FC<PresetAvatarModalProps> = ({
    show,
    onClose,
    currentAvatar,
}) => {
    const { t, language } = useTranslation();
    const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_AVATARS[0].id);
    const [updatePreset, { isLoading }] = useUpdatePresetAvatarMutation();

    useEffect(() => {
        if (show && currentAvatar) {
            const matched = PRESET_AVATARS.find(
                (p) => p.id === currentAvatar || p.svgDataUri === currentAvatar
            );
            if (matched) {
                setSelectedPreset(matched.id);
            }
        }
    }, [show, currentAvatar]);

    const handleApply = async () => {
        try {
            await updatePreset({ presetId: selectedPreset }).unwrap();
            onClose();
        } catch (err) {
            console.error('Failed to set preset avatar', err);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered dialogClassName={styles.modalDialog}>
            <Modal.Header closeButton>
                <Modal.Title>{t('avatarModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className={styles.subtitle}>{t('avatarModal.subtitle')}</p>

                <div className={styles.avatarGrid}>
                    {PRESET_AVATARS.map((avatar: PresetAvatar) => {
                        const isSelected = selectedPreset === avatar.id;
                        const title = language === 'uk' ? avatar.titleUk : avatar.titleEn;

                        return (
                            <div
                                key={avatar.id}
                                onClick={() => setSelectedPreset(avatar.id)}
                                className={`${styles.avatarCard} ${isSelected ? styles.selected : ''}`}
                            >
                                {isSelected && (
                                    <div className={styles.checkBadge}>
                                        <FaCheck />
                                    </div>
                                )}
                                <div className={styles.avatarImgWrapper}>
                                    <img
                                        src={avatar.svgDataUri}
                                        alt={title}
                                        className={styles.avatarImg}
                                    />
                                </div>
                                <div className={styles.avatarTitle}>
                                    {title}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className={styles.modalFooter}>
                    <Button variant="neutral" onClick={onClose} disabled={isLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleApply}
                        disabled={isLoading}
                        className={styles.applyBtn}
                    >
                        {isLoading ? t('common.loading') : t('avatarModal.applyBtn')}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};