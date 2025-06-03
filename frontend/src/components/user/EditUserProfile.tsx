import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../../store/api/userApi';
import { updateUser } from '../../store/users/userSlice';
import CustomModal from '../UI/Modal/Modal';
import AuthFormWrapper from '../auth/AuthFormWrapper';

interface EditUserProfileProps {
    show: boolean;
    onClose: (show: boolean) => void;
}

const EditUserProfile: React.FC<EditUserProfileProps> = ({ show, onClose }) => {
    const dispatch = useDispatch();
    const [updateProfile, { error, isLoading, reset }] =
        useUpdateProfileMutation();
    const [newLogin, setNewLogin] = useState<string>('');

    const handleUpdateLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await updateProfile({ login: newLogin }).unwrap();
            dispatch(updateUser({ login: response.login }));
            onClose(false);
        } catch (error) {
            console.error('Failed to update login:', error);
        }
    };

    const handleCloseEditProfile = () => {
        onClose(false);
        setNewLogin('');
        reset();
    };

    return (
        <CustomModal
            isOpen={show}
            onClose={handleCloseEditProfile}
            title="Edit Profile"
        >
            <AuthFormWrapper
                onSubmit={handleUpdateLogin}
                inputs={['login']}
                formData={{ login: newLogin }}
                handleChange={(e) => setNewLogin(e.target.value)}
                error={error as any}
                submitButtonText="Save Changes"
                isLoading={isLoading}
            />
        </CustomModal>
    );
};

export default EditUserProfile;
