
import styles from "./defaultInputs.module.css";

interface EmailInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({ className = "", label, value, ...props }) => {
  return (
    <div className={`${styles.inputWrapper} ${className}`}>
       <input 
        id={label} 
        type="email" 
        value={value} 
        placeholder=" "  
        className={styles.input}
        {...props} 
      />
      <label htmlFor={label} className={styles.label}>{label}</label>
    </div>
  );
};

export default EmailInput;