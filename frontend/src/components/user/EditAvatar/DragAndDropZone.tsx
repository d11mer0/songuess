import React, { useState } from 'react';
import { FaCloudArrowUp } from 'react-icons/fa6';
import styles from '../UserInfoPage.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

interface DragAndDropZoneProps {
    onFileDrop: (file: File) => void;
    setErrorMessage: (message: string) => void;
}

const DragAndDropZone: React.FC<DragAndDropZoneProps> = ({
    onFileDrop,
    setErrorMessage,
}) => {
    const { language } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

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

            onFileDrop(file);
        }
    };

    return (
        <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <FaCloudArrowUp className={styles.dropZoneIcon} />
            <div className={styles.dropZoneMainText}>
                {language === 'uk'
                    ? 'Або перетягніть файл сюди'
                    : 'Or drag and drop your file here'}
            </div>
            <div className={styles.dropZoneSubText}>
                PNG, JPG, WebP або GIF (макс. 5MB)
            </div>
        </div>
    );
};

export default DragAndDropZone;
