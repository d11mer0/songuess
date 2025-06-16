import {
    createContext,
    useContext,
    useCallback,
    useState,
    ReactNode
} from 'react';
import Toast from './Toast';
import styles from './Toast.module.css';

type ToastType = 'primary' | 'success' | 'danger' | 'neutral';
const MAX_TOASTS = 5;

interface ToastData {
    id: number;
    message: string;
    type?: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'primary') => {
        const id = toastId++;

        setToasts(prev => {
            const updated = [...prev, { id, message, type }];
            return updated.length > MAX_TOASTS ? updated.slice(1) : updated;
        });

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const handleClose = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map(({ id, message, type }) => (
                    <Toast
                        key={id}
                        message={message}
                        type={type}
                        onClose={() => handleClose(id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};