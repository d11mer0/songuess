import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../../guards/ProtectedRoute';
import UserPage from '../../../pages/Users/UserInfoPage';
import OtherUsersPage from '../../../pages/Users/OtherUsersPage';
import UserInfoPage from '../../../pages/Users/UserInfoPage';

const UserRoutes: React.FC = () => (
    <Routes>
        <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/me" replace />} />
            <Route path="me" element={<UserPage />} />
            <Route path=":id" element={<OtherUsersPage />} />
            <Route path="edit/:id" element={<UserInfoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
);

export default UserRoutes;
