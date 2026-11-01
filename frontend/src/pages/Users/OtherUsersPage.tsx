import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useGetUserByIdQuery } from '../../store/api/userApi';
import UserInfoSection from '../../components/user/UserInfoSection';
import { AchievementsShowcase } from '../../components/user/AchievementsShowcase';
import Loader from '../../components/UI/Loader/Loader/Loader';
import Button from '../../components/UI/Button/Button';
import { useTranslation } from '../../i18n/LanguageContext';
import { FaArrowLeft } from 'react-icons/fa';

const OtherUsersPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userId = Number(id);

    const { data: user, isLoading, isError } = useGetUserByIdQuery(userId, {
        skip: !userId || isNaN(userId),
    });

    if (isLoading) {
        return <Loader isFullScreen />;
    }

    if (isError || !user) {
        return (
            <Container className="my-5 text-center" style={{ color: '#fff' }}>
                <h3>{t('common.error')}</h3>
                <p style={{ color: '#aaaaaa' }}>Користувача не знайдено</p>
                <Button variant="primary" onClick={() => navigate(-1)}>
                    <FaArrowLeft style={{ marginRight: '8px' }} /> {t('common.cancel')}
                </Button>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <div style={{ marginBottom: '16px' }}>
                <Button
                    variant="primary"
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                    }}
                >
                    <FaArrowLeft /> Назад
                </Button>
            </div>

            <UserInfoSection
                user={{
                    avatar: user.avatar,
                    login: user.login,
                    email: user.email,
                    record: user.record,
                    dailyStreak: user.dailyStreak,
                    maxDailyStreak: user.maxDailyStreak,
                    isPremium: user.isPremium,
                    nameColor: user.nameColor,
                    customTitle: user.customTitle,
                }}
                isReadOnly={true}
            />

            <AchievementsShowcase userId={userId} />
        </Container>
    );
};

export default OtherUsersPage;
