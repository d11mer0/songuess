import React from 'react';
import { FaUpload, FaCheck } from 'react-icons/fa6';
import styles from '../UserInfoPage.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

interface FileUploadButtonProps {
    onFileSelect: (file: File) => void;
    newAvatar?: File | null;
    setErrorMessage: (message: string) => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
    onFileSelect,
    newAvatar,
    setErrorMessage,
}) => {
    const { language } = useTranslation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrorMessage(
                    language === 'uk'
                        ? 'Будь ласка, завантажте лише зображення!'
                        : 'Please upload an image file!'
                );
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage(
                    language === 'uk'
                        ? 'Розмір файлу не повинен перевищувати 5MB!'
                        : 'File size must not exceed 5MB!'
                );
                return;
            }
            onFileSelect(file);
        }
    };

    return (
        <label
            className={`${styles.fileButton} ${newAvatar ? styles.selected : ''}`}
        >
            {newAvatar ? (
                <FaCheck className={styles.fileButtonIcon} />
            ) : (
                <FaUpload className={styles.fileButtonIcon} />
            )}

            <span>
                {newAvatar
                    ? (language === 'uk' ? `Обрано: ${newAvatar.name}` : `Selected: ${newAvatar.name}`)
                    : (language === 'uk' ? 'Виберіть файл з пристрою' : 'Choose File from Device')}
            </span>

            <input
                type="file"
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={styles.hiddenInput}
            />
        </label>
    );
};

export default FileUploadButton;
