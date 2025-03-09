import React from "react";
import { FaUpload } from "react-icons/fa6";
import styles from "../UserInfoPage.module.css";

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  newAvatar?: File | null;
  setErrorMessage: (message: string) => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileSelect, newAvatar, setErrorMessage }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Будь ласка, завантажте лише зображення!");
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <label className={`${styles.fileButton} ${newAvatar ? styles.selected : ""}`}>
      <span>
        <FaUpload className={styles.icon} />
      </span>

      {newAvatar ? "Файл обрано" : "Виберіть файл"}
      <input type="file" onChange={handleFileChange} accept="image/*" className={styles.hiddenInput} />
    </label>
  );
};

export default FileUploadButton;
