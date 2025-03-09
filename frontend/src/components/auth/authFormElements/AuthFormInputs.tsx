import TextInputAuth from "../../UI/Inputs/AuthInputs/TextInputAuth";
import EmailInputAuth from "../../UI/Inputs/AuthInputs/EmailInputAuth";
import PasswordInputAuth from "../../UI/Inputs/AuthInputs/PasswordInputAuth";

interface AuthFormInputsProps {
  inputs: ("login" | "email" | "password")[];
  formData: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const INPUT_COMPONENTS: Record<string, { label: string; component: React.FC<any> }> = {
  login: { label: "Логін", component: TextInputAuth },
  email: { label: "Email", component: EmailInputAuth },
  password: { label: "Пароль", component: PasswordInputAuth },
};

const AuthFormInputs: React.FC<AuthFormInputsProps> = ({ inputs, formData, handleChange }) => {
  return (
    <>
      {inputs.map((name, index) => {
        const inputConfig = INPUT_COMPONENTS[name];
        if (!inputConfig) return null;

        const { label, component: Component } = inputConfig;
        return <Component key={index} label={label} value={formData[name]} onChange={handleChange} />;
      })}
    </>
  );
};

export default AuthFormInputs;