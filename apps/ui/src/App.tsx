import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/signin';
import SignupPage from './pages/signup';
import DashboardPage from './pages/dashboard';
import VerifyOTPPage from './pages/verify-otp';
import ResetPasswordPage from './pages/reset-password';
import ForgotPasswordPage from './pages/forgot-password';
import Navbar from './components/navbar';
import { useUser } from './hooks/useAuth';

function RootRedirect() {
  const { data, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-zinc-400">
        <Loader2
          className="size-8 animate-spin text-zinc-100"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm">Checking your StoreX session...</p>
      </div>
    );
  }

  return <Navigate to={data?.data?.user ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  const location = useLocation();
  const isRootRoute = location.pathname === '/';
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
      {!isRootRoute && !isDashboardRoute && !isAuthRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<RootRedirect />} />
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
