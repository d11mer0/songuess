import { BsInfoCircle, BsCheckCircle, BsXCircle, BsChatLeftText, BsXLg } from 'react-icons/bs';
import { JSX } from 'react';

import styles from './Toast.module.css';


type ToastType = 'primary' | 'success' | 'danger' | 'neutral';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose?: () => void;
}

const iconMap: Record<ToastType, JSX.Element> = {
    primary: <BsInfoCircle size={20}/>,
    success: <BsInfoCircle size={20}/>,
    danger: <BsXCircle size={20}/>,
    neutral: <BsChatLeftText size={20}/>,
};

const Toast = ({ message, type = 'primary', onClose }: ToastProps) => {
    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <span className={styles.icon}>{iconMap[type]}</span>
            <span className={styles.message}>{message}</span>
            {onClose && (
                <button className={styles.closeButton} onClick={onClose}>
                    <BsXLg />
                </button>
            )}
        </div>
    );
};

export default Toast;
