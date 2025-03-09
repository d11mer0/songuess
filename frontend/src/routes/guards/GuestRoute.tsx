import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store"; // Імпортуємо RootState

const GuestRoute: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return isAuthenticated ? <Navigate to="/songs" replace /> : <Outlet />;
};

export default GuestRoute;
