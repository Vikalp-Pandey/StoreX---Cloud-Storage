import {
  ForgotPasswordData,
  LoginOTPData,
  SignupOTPData,
  UserInviteData,
} from './template';

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

interface UserInvite {
  type: 'user_invite';
  data: UserInviteData;
}

export type MailTemplate = LoginOTP | ForgotPassword | EmailOTP | UserInvite;

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
