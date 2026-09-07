import React, { useState } from 'react';
import { useGetMeQuery } from '../../store/api/userApi';
import { Container } from 'react-bootstrap';
import UserInfoSection from '../../components/user/UserInfoSection';
import DeleteUser from '../../components/user/DeleteUser';
import EditAvatar from '../../components/user/EditAvatar';
import EditUserProfile from '../../components/user/EditUserProfile';
import { PresetAvatarModal } from '../../components/user/PresetAvatarModal';
import { DonationModal } from '../../components/liqpay/DonationModal';
import { CosmeticsModal } from '../../components/user/CosmeticsModal';
import { AchievementsShowcase } from '../../components/user/AchievementsShowcase';

const UserInfoPage: React.FC = () => {
    const { data: user, isLoading, refetch } = useGetMeQuery();

    const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
    const [showEditAvatar, setShowEditAvatar] = useState<boolean>(false);
    const [showPresetAvatar, setShowPresetAvatar] = useState<boolean>(false);
    const [showDonation, setShowDonation] = useState<boolean>(false);
    const [showCosmetics, setShowCosmetics] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    if (isLoading) return <p>Loading...</p>;

    return (
        <Container>
            <UserInfoSection
                user={user}
                onEditProfile={() => setShowEditProfile(true)}
                onEditAvatar={() => setShowEditAvatar(true)}
                onOpenPresetAvatar={() => setShowPresetAvatar(true)}
                onOpenDonation={() => setShowDonation(true)}
                onOpenCosmetics={() => setShowCosmetics(true)}
                onDelete={() => setShowDeleteConfirm(true)}
            />

            <AchievementsShowcase />

            <EditUserProfile
                show={showEditProfile}
                onClose={setShowEditProfile}
            />
            <EditAvatar
                user={user!}
                show={showEditAvatar}
                onClose={setShowEditAvatar}
            />
            <PresetAvatarModal
                show={showPresetAvatar}
                onClose={() => setShowPresetAvatar(false)}
                currentAvatar={user?.avatar}
            />
            <DonationModal
                show={showDonation}
                onClose={() => setShowDonation(false)}
                onSuccess={() => refetch()}
            />
            <CosmeticsModal
                show={showCosmetics}
                onClose={() => setShowCosmetics(false)}
                currentNameColor={user?.nameColor}
                currentTitle={user?.customTitle}
                login={user?.login}
            />
            <DeleteUser
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </Container>
    );
};

export default UserInfoPage;
