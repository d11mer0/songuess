/*import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVerifyEmailMutation, useSendTokenMutation } from '../../store/api/authApi';
import CustomModal from "../../components/UI/Modal/Modal"
import Button from '../../components/UI/Button/Button';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import useForm from '../../hooks/useForm';

import styles from './AuthPages.module.css'
import Loader from '../../components/UI/Loader/Loader';

const VERIFY_TIMEOUT = 1; // 180 секунд (3 хвилини)
const TOKEN_TYPE_EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [sendToken, { isLoading: isSending, error: sendError, reset }] = useSendTokenMutation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { formData, handleChange } = useForm<{ email: string }>({ email: "" });
  const [canResend, setCanResend] = useState<boolean>(false);
  const [resendTimeout, setResendTimeout] = useState<number>(VERIFY_TIMEOUT);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  useEffect(() => {
    if (resendTimeout > 0) {
      const timer = setTimeout(() => setResendTimeout(resendTimeout - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimeout]);

  const handleResend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendToken({ email: formData.email, type: TOKEN_TYPE_EMAIL_VERIFICATION }).unwrap();
      setIsModalOpen(false);
      setResendTimeout(VERIFY_TIMEOUT);
      setCanResend(false);
    } catch{ }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    handleChange({ target: { name: "email", value: "" } } as React.ChangeEvent<HTMLInputElement>); 
    reset(); // Очищення помилки
  };

  
  if (!isModalOpen && isLoading) {
    return (
      <Loader />
    );
  }
  return (
    <div className={styles['auth-container']}>
      {token ? (
        error ? (
          <p className={styles["auth-error"]}>Верифікація не вдалася: {(error as any).data?.message || "Помилка"}</p>
        ) : (
          <p className={styles['auth-success']}>Ваш email підтверджено!</p>
        )
      ) : (
        <>
          <p className={styles['auth-message']}>Перевірте пошту та підтвердіть ваш акаунт. Ви можете закрити це вікно.</p>
          {canResend ? (
            <Button width={'200px'} onClick={() => setIsModalOpen(true)} className={`${styles['auth-button']} ${styles['try-again']}`}>
              Try again
            </Button>
          ) : (
            <p className={styles['auth-message']}>Повторний запит буде доступний через {resendTimeout} сек.</p>
          )}
        </>
      )}

      <CustomModal isOpen={isModalOpen} onClose={handleClose} >
        <AuthFormWrapper
          onSubmit={handleResend}
          inputs={["email"]}
          formData={formData}
          handleChange={handleChange}
          submitButtonText="Надіслати"
          error={
            sendError
              ? "data" in sendError && typeof sendError.data === "object" && sendError.data !== null
                ? { data: { message: (sendError.data as any).message || "Помилка" } }
                : "Помилка запиту"
              : undefined
          }
        
          isLoading={isSending}
        />
      </CustomModal>
    </div>
  );
};

export default VerifyPage;


*/

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVerifyEmailMutation } from '../../store/api/authApi';

import styles from './AuthPages.module.css';
import Loader from '../../components/UI/Loader/Loader';
import VerificationStatus from '../../components/auth/verification/VerificationStatus';
import ResendVerification from '../../components/auth/verification/ResendVerification';
import ResendModal from '../../components/auth/verification/ResendModal';

const VERIFY_TIMEOUT = 180; // 3 хвилини

const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimeout, setResendTimeout] = useState(VERIFY_TIMEOUT);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  useEffect(() => {
    if (resendTimeout > 0) {
      const timer = setTimeout(() => setResendTimeout((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimeout]);

  if (!isModalOpen && isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles['auth-container']}>
      <VerificationStatus token={token} error={error} />
      <ResendVerification 
        canResend={canResend} 
        resendTimeout={resendTimeout} 
        onOpenModal={() => setIsModalOpen(true)} 
      />
      <ResendModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default VerifyPage;