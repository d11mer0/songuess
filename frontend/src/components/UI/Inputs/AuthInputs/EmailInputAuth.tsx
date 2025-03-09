import EmailInput from "../DefaultInputs/EmailInput";

interface EmailInputAuthProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmailInputAuth: React.FC<EmailInputAuthProps> = ({ label, value, onChange }) => {
  return <EmailInput name="email" label={label} value={value} onChange={onChange} required />;
};

export default EmailInputAuth;