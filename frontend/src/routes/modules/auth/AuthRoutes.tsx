import { Routes, Route, Navigate } from "react-router-dom";
import GuestRoute from "../../guards/GuestRoute";
import LoginPage from '../../../pages/Auth/LoginPage';
import RegisterPage from '../../../pages/Auth/RegisterPage';
import VerifyPage from '../../../pages/Auth/VerifyPage';
import ForgotPasswordPage from '../../../pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '../../../pages/Auth/ResetPasswordPage';

const AuthRoutes: React.FC = () => (
  <Routes>
    <Route element={<GuestRoute />}>
      <Route path="/" element={<Navigate to="/login" replace/>} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify" element={<VerifyPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/error" replace />} />
  </Routes>
);

export default AuthRoutes;