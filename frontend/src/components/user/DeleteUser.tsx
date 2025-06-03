import React from 'react';
import { useDeleteUserMutation } from '../../store/api/userApi';
import CustomModal from '../UI/Modal/Modal';
import Button from '../UI/Button/Button';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/users/userSlice';

interface DeleteUserProps {
    show: boolean;
    onClose: () => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({ show, onClose }) => {
    const [deleteUser] = useDeleteUserMutation();
    const dispatch = useDispatch();

    const handleDelete = async () => {
        try {
            await deleteUser().unwrap();
            dispatch(logout());
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    return (
        <CustomModal isOpen={show} onClose={onClose} title="Confirm Deletion">
            <p>
                Are you sure you want to delete your account? This action cannot
                be undone.
            </p>
            <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                    Delete
                </Button>
            </div>
        </CustomModal>
    );
};

export default DeleteUser;
