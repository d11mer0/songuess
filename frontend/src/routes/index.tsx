import { Routes, Route, Navigate } from "react-router-dom";
import AuthRoutes from "./modules/auth/AuthRoutes";
import SongsRoutes from "./modules/songs/SongsRoutes";
import Navigation from '../components/Navigation/Navigation';
import Footer from '../components/Footer/Footer';
import { useGetMeQuery } from "../store/api/userApi";
import ErrorPage from '../pages/DefaultPages/ErrorPage/ErrorPage';
import UserRoutes from "./modules/users/UserRoutes";

const AppRoutes: React.FC = () => {

  const { isLoading } = useGetMeQuery();

  if (isLoading) return null; // Поки завантажується, нічого не рендеримо(В МАЙБУТНЬОМУ ПІДКЛЮЧИТИ РЕНДЕР ЛОАДЕРА)

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/songs/*" element={<SongsRoutes />} />
        <Route path="/user/*" element={<UserRoutes />} />
        <Route path="/" element={<Navigate to="/songs" replace/>} />
        <Route path="*" element={<Navigate to="/error" replace />} />
        
      </Routes>
      <Footer />
    </>
  )
};

export default AppRoutes;