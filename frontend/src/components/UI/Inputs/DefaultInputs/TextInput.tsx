import styles from "./defaultInputs.module.css";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({ className = "", label, value, ...props }) => {
  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      <input 
        id={label} 
        type="text" 
        value={value} 
        placeholder=" "  
        className={styles.input}
        {...props} 
      />
      <label htmlFor={label} className={styles.label}>{label}</label>
    </div>
  );
};

export default TextInput;