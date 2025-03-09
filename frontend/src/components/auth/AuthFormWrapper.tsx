import AuthFormLinks from './authFormElements/AuthFormLinks';
import AuthFormInputs from './authFormElements/AuthFormInputs';
import AuthFormError from './authFormElements/AuthFormError';
import Loader from '../UI/Loader/Loader';
import styles from './AuthForm.module.css';
import Button from '../UI/Button/Button';


interface AuthFormWrapperProps {
  title?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  inputs?: ("login" | "email" | "password")[];
  formData: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: { data?: { message?: string } } | string;
  submitButtonText: string;
  isLoading?: boolean;
  links?: { to: string; label: string }[];
  children?: React.ReactNode;
}

const AuthFormWrapper: React.FC<AuthFormWrapperProps> = ({
  title, 
  onSubmit, 
  inputs = [], 
  formData, 
  handleChange, 
  error, 
  submitButtonText, 
  isLoading, 
  links = [],
  children
}) => {

  return (
    <div className={styles.container}>
      
      <h2 className={styles.title}>{title}</h2>
      <form onSubmit={onSubmit} className={styles.form}>
        <AuthFormInputs inputs={inputs} formData={formData} handleChange={handleChange} />
        <AuthFormError error={error} />
        <Button variant='primary' type="submit" disabled={isLoading}>
          {isLoading ? "Завантаження..." : submitButtonText}
        </Button>
        {children}
        {isLoading && <div style={{margin:'20px 0px'}}> <Loader /> </div> }
      </form>
      <AuthFormLinks links={links} />
    </div>
  );
};

export default AuthFormWrapper;