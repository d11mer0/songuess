import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger'| 'neutral'; // Можна додати інші стилі
    width?: string;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    width,
    ...props
}) => {
    return (
        <button
            className={`${styles.button} ${styles[variant] || ''}`}
            style={{ width: width || 'auto' }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
