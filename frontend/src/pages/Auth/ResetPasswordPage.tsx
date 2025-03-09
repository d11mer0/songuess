import { useState, FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useResetPasswordMutation } from "../../store/api/authApi";
import AuthFormWrapper from "../../components/auth/AuthFormWrapper";
import useForm from "../../hooks/useForm";

import styles from "./AuthPages.module.css";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Отримуємо токен з URL
  const navigate = useNavigate();
  const { formData, handleChange } = useForm({ password: "" });
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      console.error("Token is missing!");
      return;
    }
  
    try {
      await resetPassword({ token, newPassword: formData.password }).unwrap();
      setPasswordChanged(true);
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch {}
  };

  return (
    <div className={styles["auth-container"]}>
      {!token ? (
        <p className={styles["auth-message"]}>Невірне посилання для скидання пароля</p>
      ) : passwordChanged ? (
        <p className={styles["auth-message"]}>Пароль успішно змінено! Ви будете перенаправлені...</p>
      ) : (
        <AuthFormWrapper
          title="Введення нового пароля"
          onSubmit={handleSubmit}
          inputs={["password"]}
          formData={formData}
          handleChange={handleChange}
          error={error as any}
          submitButtonText="Змінити пароль"
          isLoading={isLoading}
          links={[{ to: "/auth/login", label: "Log in" }]}
        />
      )}
    </div>
  );
};

export default ResetPassword;