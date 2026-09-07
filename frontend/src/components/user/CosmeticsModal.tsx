import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { useUpdateCosmeticsMutation } from '../../store/api/userApi';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../UI/Button/Button';

interface CosmeticsModalProps {
    show: boolean;
    onClose: () => void;
    currentNameColor?: string;
    currentTitle?: string;
    login?: string;
}

const COLOR_PRESETS = [
    { label: 'Золото', color: '#ffd700' },
    { label: 'Неон Циан', color: '#00f3ff' },
    { label: 'Неон Рожевий', color: '#ff007f' },
    { label: 'Смарагд', color: '#39ff14' },
    { label: 'Фіолетовий', color: '#bd00ff' },
];

export const CosmeticsModal: React.FC<CosmeticsModalProps> = ({
    show,
    onClose,
    currentNameColor = '#ffd700',
    currentTitle = '',
    login = 'Player',
}) => {
    const { t } = useTranslation();
    const [nameColor, setNameColor] = useState<string>(currentNameColor || '#ffd700');
    const [customTitle, setCustomTitle] = useState<string>(currentTitle || '');
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    const [updateCosmetics, { isLoading }] = useUpdateCosmeticsMutation();

    const handleSave = async () => {
        try {
            await updateCosmetics({ nameColor, customTitle }).unwrap();
            setStatusMsg(t('profile.cosmeticsSuccess'));
            setTimeout(() => {
                setStatusMsg(null);
                onClose();
            }, 1200);
        } catch (err) {
            console.error('Failed to update cosmetics', err);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered contentClassName="bg-dark text-white border-warning">
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title style={{ color: '#ffd700', fontWeight: 800 }}>
                    {t('profile.cosmeticsTitle')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-secondary small">{t('profile.cosmeticsDesc')}</p>

                {/* Попередній перегляд (Preview) */}
                <div
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <div className="text-secondary small mb-1">{t('profile.previewNickname')}</div>
                    <div
                        style={{
                            fontSize: '1.4rem',
                            fontWeight: 800,
                            color: nameColor,
                            textShadow: `0 0 14px ${nameColor}88`,
                        }}
                    >
                        ⭐ {login}
                    </div>
                    {customTitle && (
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: '#ffd700',
                                fontWeight: 600,
                                marginTop: '4px',
                            }}
                        >
                            [{customTitle}]
                        </div>
                    )}
                </div>

                {/* Колір ніку */}
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary">{t('profile.nameColor')}</Form.Label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {COLOR_PRESETS.map((preset) => (
                            <div
                                key={preset.color}
                                onClick={() => setNameColor(preset.color)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: preset.color,
                                    cursor: 'pointer',
                                    border: nameColor === preset.color ? '3px solid #ffffff' : '2px solid transparent',
                                    boxShadow: nameColor === preset.color ? `0 0 10px ${preset.color}` : 'none',
                                    transition: 'transform 0.15s ease',
                                }}
                                title={preset.label}
                            />
                        ))}
                    </div>
                </Form.Group>

                {/* Кастомний титул */}
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary">Власний титул</Form.Label>
                    <Form.Control
                        type="text"
                        maxLength={30}
                        placeholder={t('profile.customTitlePlaceholder')}
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="bg-secondary text-white border-0"
                    />
                </Form.Group>

                {statusMsg && (
                    <div className="text-success small text-center mt-2 font-weight-bold">
                        {statusMsg}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('profile.updateCosmeticsBtn')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};