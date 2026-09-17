import { Hono } from 'hono';
import { validateUser } from '@/middlewares/user.middleware';
import jwtAuthController from '@/controllers/authControllers/auth.controller';
import { asyncHandler } from '@packages/httputils';

const auth = new Hono();

auth.get('/me', validateUser, jwtAuthController.getUserStatus);
auth.post('/signup', asyncHandler(jwtAuthController.signupUser));
auth.post('/signin', jwtAuthController.signinUser);
auth.post('/logout', validateUser, jwtAuthController.logoutUser);
auth.post('/verify-OTP', jwtAuthController.verifyOTP);
auth.post('/verify-email', jwtAuthController.verifyEmail);
auth.post('/forgot-password', jwtAuthController.forgotPassword); // forgot password user can't be authenticated
auth.post('/reset-password', jwtAuthController.resetPassword);

export default auth;
