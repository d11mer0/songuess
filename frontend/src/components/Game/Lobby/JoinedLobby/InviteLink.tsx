import React, { useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';
import RoomShareModal from '../../Gameplay/RoomShareModal';
import styles from './JoinedLobby.module.css';

interface Props {
    roomId: string;
    shortCode?: string;
}

const InviteLink: React.FC<Props> = ({ roomId, shortCode }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

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
