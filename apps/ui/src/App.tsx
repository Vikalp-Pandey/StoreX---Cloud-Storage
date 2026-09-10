import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/signin';
import SignupPage from './pages/signup';
import DashboardPage from './pages/dashboard';
import VerifyOTPPage from './pages/verify-otp';
import ResetPasswordPage from './pages/reset-password';
import ForgotPasswordPage from './pages/forgot-password';
import Navbar from './components/navbar';
import AboutPage from './pages/about';

function AppRoutes() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isAuthRoute = [
    '/login',
    '/signup',
    '/verify-otp',
    '/forgot-password',
    '/reset-password',
  ].some((path) => location.pathname.startsWith(path));

  return (
    <>
      {!isDashboardRoute && !isAuthRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={6000} theme="dark" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
