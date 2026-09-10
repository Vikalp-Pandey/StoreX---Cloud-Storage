import { ForgotPasswordData, LoginOTPData, SignupOTPData } from './template';

interface LoginOTP {
  type: 'login_otp';
  data: LoginOTPData;
}

interface EmailOTP {
  type: 'email_otp';
  data: SignupOTPData;
}

interface ForgotPassword {
  type: 'forgot_password';
  data: ForgotPasswordData;
}

export type MailTemplate = LoginOTP | ForgotPassword | EmailOTP;

export interface EmailArgs {
  to: string | string[];
  subject: string;
  template: MailTemplate;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}
