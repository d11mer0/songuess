import React from 'react';
import { Row, Col, Image } from 'react-bootstrap';
import Button from '../UI/Button/Button';
import styles from './UserInfoPage.module.css';
import { useTranslation } from '../../i18n/LanguageContext';

interface User {
    avatar?: string;
    login?: string;
    email?: string;
    record?: number;
    dailyStreak?: number;
    maxDailyStreak?: number;
    isPremium?: boolean;
    nameColor?: string;
    customTitle?: string;
}

interface UserInfoSectionProps {
    user?: User;
    onEditProfile: () => void;
    onEditAvatar: () => void;
    onOpenPresetAvatar: () => void;
    onOpenDonation: () => void;
    onOpenCosmetics: () => void;
    onDelete: () => void;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({
    user,
    onEditProfile,
    onEditAvatar,
    onOpenPresetAvatar,
    onOpenDonation,
    onOpenCosmetics,
    onDelete,
}) => {
    const { t } = useTranslation();

    const isPremium = user?.isPremium || false;
    const nameColor = user?.nameColor || (isPremium ? '#ffd700' : '#ffffff');

    return (
        <Row className="my-4 align-items-center">
            <Col md={4} className="text-center position-relative">
                <div style={{ display: 'inline-block', position: 'relative' }}>
                    <Image
                        src={user?.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                        roundedCircle
                        width={150}
                        height={150}
                        referrerPolicy="no-referrer"
                        style={{
                            border: isPremium ? '4px solid #ffd700' : '3px solid rgba(255,255,255,0.2)',
                            boxShadow: isPremium ? '0 0 25px rgba(255, 215, 0, 0.6)' : 'none',
                            padding: '3px',
                            backgroundColor: '#12121a',
                            objectFit: 'cover',
                        }}
                    />
                    {isPremium && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '10px',
                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '2px solid #000',
                                boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                            }}
                        >
                            ⭐ VIP
                        </div>
                    )}
                </div>
            </Col>
            <Col md={8}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2
                        style={{
                            margin: 0,
                            color: nameColor,
                            textShadow: isPremium ? `0 0 16px ${nameColor}99` : 'none',
                            fontWeight: 800,
                        }}
                    >
                        {user?.login}
                    </h2>
                    {isPremium && (
                        <span
                            style={{
                                fontSize: '0.8rem',
                                color: '#ffd700',
                                border: '1px solid #ffd700',
                                borderRadius: '8px',
                                padding: '2px 8px',
                                fontWeight: 700,
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            }}
                        >
                            {user?.customTitle ? user.customTitle : t('profile.vipStatus')}
                        </span>
                    )}
                </div>

                <p className={styles.email} style={{ marginTop: '6px' }}>
                    📩 {user?.email || t('profile.notSpecified')}
                </p>

                {/* Статистика */}
                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                        color: '#cccccc',
                    }}
                >
                    <div>
                        🏆 {t('profile.record')}: <strong style={{ color: '#00f3ff' }}>{user?.record || 0}</strong> {t('common.pts')}
                    </div>
                    <div>
                        🔥 {t('profile.streak')}: <strong style={{ color: '#ff007f' }}>{user?.dailyStreak || 0}</strong> {t('common.days')}
                    </div>
                </div>

                <div className={styles.buttonContainer} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Button variant="primary" onClick={onOpenPresetAvatar} style={{ background: '#7928ca', borderColor: '#7928ca' }}>
                        {t('profile.choosePresetAvatar')}
                    </Button>
                    <Button variant="primary" onClick={onEditAvatar}>
                        {t('profile.editAvatar')}
                    </Button>
                    <Button variant="primary" onClick={onEditProfile}>
                        {t('profile.editProfile')}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={onOpenDonation}
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                            color: '#000000',
                            border: 'none',
                            fontWeight: 700,
                        }}
                    >
                        {t('profile.buyCoffee')}
                    </Button>

                    {isPremium && (
                        <Button
                            variant="primary"
                            onClick={onOpenCosmetics}
                            style={{
                                background: 'transparent',
                                border: '1px solid #ffd700',
                                color: '#ffd700',
                                fontWeight: 600,
                            }}
                        >
                            {t('profile.styleBtn')}
                        </Button>
                    )}

                    <Button variant="danger" onClick={onDelete}>
                        {t('profile.deleteAccount')}
                    </Button>
                </div>
            </Col>
        </Row>
    );
};

export default UserInfoSection;
