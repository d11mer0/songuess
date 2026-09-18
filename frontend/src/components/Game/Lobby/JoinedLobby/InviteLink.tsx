import React, { useState } from 'react';
import Button from '../../../UI/Button/Button';
import { useToast } from '../../../UI/Toast/ToastContext';
import { useTranslation } from '../../../../i18n/LanguageContext';
import RoomShareModal from '../../Gameplay/RoomShareModal';

interface Props {
    roomId: string;
    shortCode?: string;
}

const InviteLink: React.FC<Props> = ({ roomId, shortCode }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inviteCode = shortCode || roomId;
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;

    const handleQuickCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(inviteLink);
            showToast(t('shareModal.linkCopied'), 'success');
        } catch {
            showToast(t('common.error'), 'danger');
        }
    };

    return (
        <>
            <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                title={t('shareModal.inviteFriends')}
            >
                {t('shareModal.inviteFriends')}
            </Button>
            <Button
                variant="neutral"
                onClick={handleQuickCopy}
                title={t('shareModal.copyLink')}
            >
                {t('shareModal.quickCopy')}
            </Button>

            <RoomShareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roomId={roomId}
                shortCode={shortCode}
            />
        </>
    );
};

export default InviteLink;
