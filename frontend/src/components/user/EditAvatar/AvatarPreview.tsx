import React from 'react';
import { FaCamera } from 'react-icons/fa6';
import styles from '../UserInfoPage.module.css';

interface AvatarPreviewProps {
    previewAvatar?: string;
    user?: { avatar?: string; login?: string };
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({
    previewAvatar,
    user,
}) => {
    const avatarSrc = previewAvatar || user?.avatar || '/default-avatar.png';

    return (
        <div className={styles.avatarPreviewContainer}>
            <img
                src={avatarSrc}
                alt={user?.login || 'Avatar'}
                className={styles.avatarPreviewImg}
            />
            <div className={styles.avatarBadge} title="Avatar preview">
                <FaCamera />
            </div>
        </div>
    );
};

export default AvatarPreview;
