import styles from './defaultInputs.module.css';

type TextInputProps = {
    label: string;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const TextInput: React.FC<TextInputProps> = ({
    className = '',
    label,
    ...props
}) => {
    return (
        <div className={`${styles.inputWrapper} ${className}`}>
            <input
                id={label}
                type="text"
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

export default TextInput;
