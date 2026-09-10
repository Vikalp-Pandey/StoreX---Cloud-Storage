import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

// M2: Templates using a React Email (Homework)
export interface LoginOTPData {
  to_username: string;
  otp: string;
}
export function OtpVerificationEmail(data: LoginOTPData) {
  return (
    <Html>
      <Head />
      <Preview>Your OTP Code for Login</Preview>

      <Tailwind>
        <Body className="bg-gray-100 p-6 font-sans">
          <Container className="bg-white max-w-md mx-auto p-8 rounded-xl shadow-md">
            <Section>
              <Heading className="text-2xl font-bold text-center mb-6">
                Login Verification
              </Heading>

              <Text className="text-gray-700 text-base mb-4">
                Hi <span className="font-semibold">{data.to_username}</span>,
              </Text>

              <Text className="text-gray-700 text-base">
                Use the following One-Time Password (OTP) to complete your
                login:
              </Text>

              <Section className="bg-indigo-100 rounded-lg text-center py-4 my-6">
                <Text className="text-3xl font-bold tracking-widest text-indigo-600">
                  {data.otp}
                </Text>
              </Section>

              <Text className="text-gray-700 text-base">
                This code will expire in <strong>5 minutes</strong>. Please do
                not share this OTP with anyone.
              </Text>

              <hr className="border-gray-300 my-6" />

              <Text className="text-xs text-gray-500 text-center">
                If this wasn’t you, please secure your account immediately.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
export interface ForgotPasswordData {
  to_username: string;
  reset_link: string;
}
export function ForgotPasswordEmail(data: ForgotPasswordData) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>

      <Tailwind>
        <Body className="bg-gray-100 px-6 py-8 font-sans">
          <Container className="bg-white max-w-md mx-auto p-8 rounded-xl shadow-lg">
            <Section>
              <Heading className="text-2xl font-bold text-center mb-4">
                Reset Your Password
              </Heading>

              <Text className="text-gray-700 text-base mb-4">
                Hi <span className="font-semibold">{data.to_username}</span>,
              </Text>

              <Text className="text-gray-700 text-base">
                We received a request to reset your password. Click the button
                below to choose a new one.
              </Text>

              <Section className="text-center mt-6 mb-6">
                <Link
                  href={data.reset_link}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold inline-block"
                >
                  Reset Password
                </Link>
              </Section>

              <Text className="text-gray-700 text-sm">
                If you didn’t request this, you can safely ignore this email.
                Your password will not be changed.
              </Text>

              <hr className="border-gray-300 my-6" />

              <Text className="text-xs text-gray-500 text-center">
                Keep your account secure by not sharing it with anyone.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export interface SignupOTPData {
  to_username: string;
  otp: string;
}

export function SignupVerificationEmail(data: SignupOTPData) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to complete signup on Tierly</Preview>

      <Tailwind>
        <Body className="bg-gray-100 p-6 font-sans">
          <Container className="bg-white max-w-md mx-auto p-8 rounded-xl shadow-md">
            <Section>
              <Heading className="text-2xl font-bold text-center mb-6">
                Verify Your Email
              </Heading>

              <Text className="text-gray-700 text-base mb-4">
                Hi <span className="font-semibold">{data.to_username}</span>,
              </Text>

              <Text className="text-gray-700 text-base">
                Thank you for signing up on <strong>Tierly</strong>! Please
                verify your email address using the One-Time Password (OTP)
                below:
              </Text>

              <Section className="bg-indigo-100 rounded-lg text-center py-4 my-6">
                <Text className="text-3xl font-bold tracking-widest text-indigo-600">
                  {data.otp}
                </Text>
              </Section>

              <Text className="text-gray-700 text-base">
                This OTP is valid for <strong>5 minutes</strong>. Do not share
                this code with anyone.
              </Text>

              <hr className="border-gray-300 my-6" />

              <Text className="text-xs text-gray-500 text-center">
                If you did not create a Tierly account, please ignore this
                email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
