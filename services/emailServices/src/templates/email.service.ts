// import env from '@/env';

import { createTransport, Transporter } from 'nodemailer';
import { EmailArgs, MailTemplate } from './email.type';
import {
  ForgotPasswordEmail,
  OtpVerificationEmail,
  SignupVerificationEmail,
} from './template';
import { render } from '@react-email/components';

export class EmailService {
  private name: string;
  private mail: string;
  private replyTo: string;
  private transporter: Transporter;

  constructor(
    name: string,
    mail: string,
    replyTo: string,
    host: string,
    port: number,
    username: string,
    password: string,
  ) {
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
    });

    this.name = name;
    this.mail = mail;
    this.replyTo = replyTo;
  }

  private async getTemplate(template: MailTemplate) {
    // Nodemailer expects HTML as a STRING, not JSX template
    /*
      - Install (pnpm add react react-dom)
      -
        import { renderToStaticMarkup } from "react-dom/server";       


    */
    let component;
    switch (template.type) {
      case 'login_otp':
        component = OtpVerificationEmail(template.data);
        break;
      case 'forgot_password':
        component = ForgotPasswordEmail(template.data);
        break;
      case 'email_otp':
        component = SignupVerificationEmail(template.data);
        break;
      default:
        throw new Error('Unsupported email template type');
    }

    // Use the render function to convert the React component to HTML string
    return await render(component);
  }

  async sendEmail(args: EmailArgs) {
    const htmlTemplate = await this.getTemplate(args.template);
    await this.transporter.sendMail({
      from: {
        name: this.name,
        address: this.mail,
      },
      replyTo: this.replyTo,
      to: args.to,
      subject: args.subject,
      html: htmlTemplate,
      attachments: args.attachments,
    });
  }
}

// const emailService = new EmailService(
//   env.SMTP_NAME,
//   env.SMTP_MAIL,
//   env.SMTP_REPLY_TO,
//   env.SMTP_HOST,
//   env.SMTP_PORT,
//   env.SMTP_USERNAME,
//   env.SMTP_PASSWORD
// );

// export default emailService;
