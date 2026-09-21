import React, { useState } from 'react';
import { FaQrcode, FaCopy, FaCheck } from 'react-icons/fa';
import { useToast } from '../../../UI/Toast/ToastContext';
import { useTranslation } from '../../../../i18n/LanguageContext';
import RoomShareModal from '../../Gameplay/RoomShareModal';
import styles from './JoinedLobby.module.css';

interface Props {
    roomId: string;
    shortCode?: string;
}

const InviteLink: React.FC<Props> = ({ roomId, shortCode }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const inviteCode = shortCode || roomId;
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;

    const handleQuickCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);
            showToast(t('shareModal.linkCopied'), 'success');
            setTimeout(() => setIsCopied(false), 2000);
        } catch {
            showToast(t('common.error'), 'danger');
        }
    };

    return (
        <div className={styles.shareRow}>
            <button
                type="button"
                className={styles.inviteFriendsBtn}
                onClick={() => setIsModalOpen(true)}
                title={t('shareModal.inviteFriends')}
            >
                <FaQrcode className={styles.actionBtnIcon} />
                <span>{t('shareModal.inviteFriends')}</span>
            </button>
            <button
                type="button"
                className={`${styles.quickCopyBtn} ${isCopied ? styles.quickCopySuccess : ''}`}
                onClick={handleQuickCopy}
                title={t('shareModal.copyLink')}
            >
                {isCopied ? <FaCheck className={styles.actionBtnIcon} /> : <FaCopy className={styles.actionBtnIcon} />}
                <span>{isCopied ? t('shareModal.linkCopied') : t('shareModal.quickCopy')}</span>
            </button>

            <RoomShareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roomId={roomId}
                shortCode={shortCode}
            />
        </div>
    );
};

export default InviteLink;
