import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store'; // Імпортуємо RootState

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
