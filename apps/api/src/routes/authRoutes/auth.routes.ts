import { Hono } from 'hono';
import { validateUser } from '@/middlewares/user.middleware';
import jwtAuthController from '@/controllers/authControllers/auth.controller';

const auth = new Hono();

auth.get('/me', validateUser, jwtAuthController.getUserStatus);
auth.post('/signup', jwtAuthController.signupUser);
auth.post('/signin', jwtAuthController.signinUser);
auth.post('/logout', validateUser, jwtAuthController.logoutUser);
auth.post('/verify-OTP', jwtAuthController.verifyOTP);
auth.post('/forgot-password', jwtAuthController.forgotPassword);// forgot password user can't be authenticated
auth.post('/reset-password', jwtAuthController.resetPassword);


export default auth;
