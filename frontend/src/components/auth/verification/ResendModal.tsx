import { FormEvent } from 'react';
import { useSendTokenMutation } from '../../../store/api/authApi';
import CustomModal from '../../UI/Modal/Modal';
import AuthFormWrapper from '../../auth/AuthFormWrapper';
import useForm from '../../../hooks/useForm';

const TOKEN_TYPE_EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

interface ResendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResendModal: React.FC<ResendModalProps> = ({ isOpen, onClose }) => {
    const { formData, handleChange } = useForm<{ email: string }>({
        email: '',
    });
    const [sendToken, { isLoading, error, reset }] = useSendTokenMutation();

    const handleResend = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await sendToken({
                email: formData.email,
                type: TOKEN_TYPE_EMAIL_VERIFICATION,
            }).unwrap();
            onClose();
        } catch {}
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose}>
            <AuthFormWrapper
                onSubmit={handleResend}
                inputs={['email']}
                formData={formData}
                handleChange={handleChange}
                submitButtonText="Надіслати"
                error={
                    error
                        ? 'data' in error &&
                          typeof error.data === 'object' &&
                          error.data !== null
                            ? {
                                  data: {
                                      message:
                                          (error.data as any).message ||
                                          'Помилка',
                                  },
                              }
                            : 'Помилка запиту'
                        : undefined
                }
                isLoading={isLoading}
            />
        </CustomModal>
    );
};

export default ResendModal;
