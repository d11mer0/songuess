import { useState } from 'react';
import styles from './defaultInputs.module.css';

interface PasswordInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    name?: string;
    required?: boolean; // 🟢 Додаємо required
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    className = '',
    label,
    value,
    name,
    required,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`${styles.passwordWrapper} ${className}`}>
            <input
                id={label}
                type={showPassword ? 'text' : 'password'}
                value={value}
                name={name}
                required={required} // 🟢 Додаємо required у input
                placeholder=" "
                className={`${styles.input} ${styles.password}`}
                {...props}
            />
            <label htmlFor={label} className={styles.label}>
                {label}
            </label>
            <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
            >
                {showPassword ? '🙈' : '👁️'}
            </button>
        </div>
    );
};

export default PasswordInput;
