import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { PRESET_AVATARS, PresetAvatar } from '../../assets/avatars/presetAvatars';
import { useUpdatePresetAvatarMutation } from '../../store/api/userApi';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../UI/Button/Button';

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

    const handleApply = async () => {
        try {
            await updatePreset({ presetId: selectedPreset }).unwrap();
            onClose();
        } catch (err) {
            console.error('Failed to set preset avatar', err);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered contentClassName="bg-dark text-white border-primary">
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title>{t('avatarModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-secondary small mb-3">{t('avatarModal.subtitle')}</p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '14px',
                        justifyItems: 'center',
                    }}
                >
                    {PRESET_AVATARS.map((avatar: PresetAvatar) => {
                        const isSelected = selectedPreset === avatar.id;
                        const title = language === 'uk' ? avatar.titleUk : avatar.titleEn;

                        return (
                            <div
                                key={avatar.id}
                                onClick={() => setSelectedPreset(avatar.id)}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    textAlign: 'center',
                                    border: isSelected
                                        ? '3px solid #00f3ff'
                                        : '2px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: isSelected
                                        ? 'rgba(0, 243, 255, 0.15)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    boxShadow: isSelected
                                        ? '0 0 16px rgba(0, 243, 255, 0.4)'
                                        : 'none',
                                    transition: 'all 0.2s ease',
                                    width: '100%',
                                }}
                            >
                                <img
                                    src={avatar.svgDataUri}
                                    alt={title}
                                    style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        display: 'block',
                                        margin: '0 auto 6px',
                                    }}
                                />
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: isSelected ? '#00f3ff' : '#cccccc',
                                    }}
                                >
                                    {title}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button variant="primary" onClick={handleApply} disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('avatarModal.applyBtn')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};