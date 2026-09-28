import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateAvatarMutation } from '../../store/api/userApi';
import { updateUser } from '../../store/users/userSlice';
import CustomModal from '../UI/Modal/Modal';
import Button from '../UI/Button/Button';
import Loader from '../UI/Loader/Loader/Loader';
import AuthFormError from '../auth/authFormElements/AuthFormError';
import FileUploadButton from './EditAvatar/FileUploadButton';
import DragAndDropZone from './EditAvatar/DragAndDropZone';
import AvatarPreview from './EditAvatar/AvatarPreview';
import styles from './UserInfoPage.module.css';
import { useTranslation } from '../../i18n/LanguageContext';
import { FaCloudArrowUp } from 'react-icons/fa6';

interface EditAvatarProps {
    user: {
        avatar?: string;
        login?: string;
    };
    show: boolean;
    onClose: (show: boolean) => void;
}

const EditAvatar: React.FC<EditAvatarProps> = ({ user, show, onClose }) => {
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    const [updateAvatar, { error, isLoading, reset }] =
        useUpdateAvatarMutation();
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleAvatarChange = (file: File) => {
        setNewAvatar(file);
        setPreviewAvatar(URL.createObjectURL(file));
        setErrorMessage('');
    };

    const handleUpdate = async () => {
        if (!newAvatar) {
            setErrorMessage(
                language === 'uk'
                    ? 'Будь ласка, спочатку оберіть файл зображення!'
                    : 'Please select an image file first!'
            );
            return;
        }
        try {
            const formData = new FormData();
            formData.append('avatar', newAvatar);
            const response = await updateAvatar(formData).unwrap();
            dispatch(updateUser({ avatar: response.avatar }));
            handleClose();
        } catch (error) {
            console.error('Failed to update avatar:', error);
        }
    };

    const handleClose = () => {
        onClose(false);
        setPreviewAvatar('');
        setNewAvatar(null);
        setErrorMessage('');
        reset();
    };

    const modalTitle = t('profile.editAvatar');

    if (isLoading) {
        return (
            <CustomModal
                isOpen={show}
                title={modalTitle}
                onClose={handleClose}
            >
                <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                    <Loader />
                </div>
            </CustomModal>
        );
    }

    return (
        <CustomModal isOpen={show} onClose={handleClose} title={modalTitle}>
            <div className={styles.avatarModalContent}>
                <AvatarPreview previewAvatar={previewAvatar} user={user} />
                
                <FileUploadButton
                    onFileSelect={handleAvatarChange}
                    newAvatar={newAvatar}
                    setErrorMessage={setErrorMessage}
                />
                
                <DragAndDropZone
                    onFileDrop={handleAvatarChange}
                    setErrorMessage={setErrorMessage}
                />

                {(error as any)?.data?.message || errorMessage ? (
                    <AuthFormError
                        error={(error as any)?.data?.message || errorMessage}
                    />
                ) : null}

                <div className={styles.modalActions}>
                    <Button
                        variant="neutral"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className={styles.uploadSubmitBtn}
                    >
                        <FaCloudArrowUp />
                        {isLoading
                            ? t('common.loading')
                            : (language === 'uk' ? 'Завантажити аватар' : 'Upload Avatar')}
                    </Button>
                </div>
            </div>
        </CustomModal>
    );
};

export default EditAvatar;
