import PasswordInput from "../DefaultInputs/PasswordInput";

interface PasswordInputAuthProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordInputAuth: React.FC<PasswordInputAuthProps> = ({ label, value, onChange }) => {
  return <PasswordInput name="password" label={label} value={value} onChange={onChange} required />;
};

export default PasswordInputAuth;