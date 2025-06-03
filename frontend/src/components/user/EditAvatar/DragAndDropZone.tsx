import React, { useState } from 'react';
import styles from '../UserInfoPage.module.css';

interface DragAndDropZoneProps {
    onFileDrop: (file: File) => void;
    setErrorMessage: (message: string) => void;
}

const DragAndDropZone: React.FC<DragAndDropZoneProps> = ({
    onFileDrop,
    setErrorMessage,
}) => {
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
                setErrorMessage('Будь ласка, завантажте лише зображення!');
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
            Перетягніть файл сюди
        </div>
    );
};

export default DragAndDropZone;
