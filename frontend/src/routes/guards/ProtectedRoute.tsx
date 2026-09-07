import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useGetMeQuery } from '../../store/api/userApi';
import Loader from '../../components/UI/Loader/Loader/Loader';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { isLoading } = useGetMeQuery();

    if (isLoading && !isAuthenticated) {
        return <Loader />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
