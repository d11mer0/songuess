import { useState } from 'react';
import styles from './defaultInputs.module.css';
import React from 'react';

type PasswordInputProps = {
    label: string;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput: React.FC<PasswordInputProps> = ({
    className = '',
    label,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`${styles.passwordWrapper} ${className}`}>
            <input
                id={label}
                type={showPassword ? 'text' : 'password'}
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
