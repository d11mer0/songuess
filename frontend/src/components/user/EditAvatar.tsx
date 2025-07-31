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

interface EditAvatarProps {
    user: {
        avatar?: string;
        login?: string;
    };
    show: boolean;
    onClose: (show: boolean) => void;
}
const EditAvatar: React.FC<EditAvatarProps> = ({ user, show, onClose }) => {
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
            setErrorMessage('SELECT FILE!');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('avatar', newAvatar);
            const response = await updateAvatar(formData).unwrap();
            dispatch(updateUser({ avatar: response.avatar }));
            onClose(false);
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

    if (isLoading) {
        return (
            <CustomModal
                isOpen={show}
                title="Edit Avatar"
                onClose={handleClose}
            >
                <Loader />
            </CustomModal>
        );
    }

    return (
        <CustomModal isOpen={show} onClose={handleClose} title="Edit Avatar">
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
            <div className={styles.uploadButtonContainer}>
                <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={isLoading}
                    width={'40%'}
                >
                    {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
            </div>
        </CustomModal>
    );
};

export default EditAvatar;
