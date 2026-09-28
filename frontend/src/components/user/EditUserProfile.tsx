import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useUpdateProfileMutation } from '../../store/api/userApi';
import { updateUser } from '../../store/users/userSlice';
import { RootState } from '../../store/store';
import CustomModal from '../UI/Modal/Modal';
import Button from '../UI/Button/Button';
import AuthFormError from '../auth/authFormElements/AuthFormError';
import styles from './EditUserProfile.module.css';
import { useTranslation } from '../../i18n/LanguageContext';
import { FaUserPen, FaUser } from 'react-icons/fa6';

interface EditUserProfileProps {
    show: boolean;
    onClose: (show: boolean) => void;
}

const EditUserProfile: React.FC<EditUserProfileProps> = ({ show, onClose }) => {
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    const currentUser = useSelector((state: RootState) => state.user.user);
    const [updateProfile, { error, isLoading, reset }] =
        useUpdateProfileMutation();
    const [newLogin, setNewLogin] = useState<string>('');
    const [validationError, setValidationError] = useState<string>('');

    useEffect(() => {
        if (show) {
            setNewLogin(currentUser?.login || '');
            setValidationError('');
            reset();
        }
    }, [show, currentUser?.login, reset]);

    const handleUpdateLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = newLogin.trim();

        if (trimmed.length < 3 || trimmed.length > 20) {
            setValidationError(
                language === 'uk'
                    ? 'Нікнейм має містити від 3 до 20 символів!'
                    : 'Username must be between 3 and 20 characters!'
            );
            return;
        }

        if (trimmed === currentUser?.login) {
            onClose(false);
            return;
        }

        try {
            const response = await updateProfile({ login: trimmed }).unwrap();
            dispatch(updateUser({ login: response.login }));
            handleClose();
        } catch (error) {
            console.error('Failed to update login:', error);
        }
    };

    const handleClose = () => {
        onClose(false);
        setNewLogin('');
        setValidationError('');
        reset();
    };

    const modalTitle = t('profile.editProfile');

    return (
        <CustomModal
            isOpen={show}
            onClose={handleClose}
            title={modalTitle}
        >
            <div className={styles.container}>
                <div className={styles.headerIconWrapper}>
                    <FaUserPen className={styles.headerIcon} />
                </div>

                <p className={styles.description}>
                    {language === 'uk'
                        ? 'Введіть новий нікнейм, який відображатиметься в таблиці лідерів та іграх:'
                        : 'Enter a new username that will be displayed in leaderboards and games:'}
                </p>

                <form onSubmit={handleUpdateLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            {language === 'uk' ? 'Нікнейм' : 'Username'}
                        </label>
                        <div className={styles.inputWrapper}>
                            <FaUser className={styles.inputIcon} />
                            <input
                                type="text"
                                maxLength={20}
                                value={newLogin}
                                onChange={(e) => {
                                    setNewLogin(e.target.value);
                                    setValidationError('');
                                }}
                                placeholder={
                                    language === 'uk'
                                        ? 'Введіть новий нік'
                                        : 'Enter new username'
                                }
                                className={styles.inputField}
                                autoFocus
                            />
                        </div>
                        <div className={styles.hint}>
                            <span>{language === 'uk' ? 'Від 3 до 20 символів' : '3 to 20 characters'}</span>
                            <span className={styles.charCount}>{newLogin.length}/20</span>
                        </div>
                    </div>

                    {(error as any)?.data?.message || validationError ? (
                        <AuthFormError
                            error={(error as any)?.data?.message || validationError}
                        />
                    ) : null}

                    <div className={styles.modalActions}>
                        <Button
                            variant="neutral"
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isLoading || !newLogin.trim()}
                            className={styles.saveBtn}
                        >
                            {isLoading ? t('common.loading') : (language === 'uk' ? 'Зберегти зміни' : 'Save Changes')}
                        </Button>
                    </div>
                </form>
            </div>
        </CustomModal>
    );
};

export default EditUserProfile;
