import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger'| 'neutral'; // Можна додати інші стилі
    width?: string;
    isNotAdaptive?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    width,
    isNotAdaptive,
    ...props
}) => {
    return (
        <button
            className={`${styles.button} ${styles[variant] || ''} ${!isNotAdaptive ? styles.responsive : ''}`}
            style={{ width: width || 'auto' }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
