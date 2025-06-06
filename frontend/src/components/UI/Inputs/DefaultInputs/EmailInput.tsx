import styles from './defaultInputs.module.css';

type EmailInputProps = {
    label: string;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const EmailInput: React.FC<EmailInputProps> = ({
    className = '',
    label,
    ...props
}) => {
    return (
        <div className={`${styles.inputWrapper} ${className}`}>
            <input
                id={label}
                type="email"
                placeholder=" "
                className={styles.input}
                {...props}
            />
            <label htmlFor={label} className={styles.label}>
                {label}
            </label>
        </div>
    );
};

export default EmailInput;
