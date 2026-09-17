import env from '@packages/env';
import { accountType } from '@/models/authModels/user.model';
import axios from 'axios';

const getGithubURL = async () => {
  const githubURL = 'https://github.com/login/oauth/authorize';

  const params = new URLSearchParams({
    client_id: env!.GITHUB_CLIENT_ID,
    redirect_uri: env!.GITHUB_REDIRECT_URI,
    scope: 'user:email',
  }).toString();
  return `${githubURL}?${params}`;
};

const signinwithGithub = async (code: string) => {
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',

    {
      client_id: env!.GITHUB_CLIENT_ID,
      client_secret: env!.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env!.GITHUB_REDIRECT_URI,
    },
    {
      headers: { Accept: 'application/json' },
    },
  );
  const access_token = tokenResponse.data.access_token;
  const userResponse = await axios.get(`http://api.github.com/user`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const user = userResponse.data;

  const emailResponse = await axios.get('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'User-Agent': 'Stripe-App',
    },
  });

  const email = emailResponse.data.find(
    (email: any) => email.primary && email.verified,
  ).email;

  const userData = {
    name: user.name,
    email: email,
    accountType: accountType.Github,
    accessToken: access_token,
    twoFactorEnabled: false,
  };

  return userData;
};

const getGoogleURL = async () => {
  const rootURL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = new URLSearchParams({
    redirect_uri: env!.GOOGLE_REDIRECT_URI,
    client_id: env!.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  }).toString();
  const googleOauthUrl = `${rootURL}?${options}`;
  return googleOauthUrl;
};

const signinwithGoogle = async (code: string) => {
  const tokenResponse = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      code,
      client_id: env!.GOOGLE_CLIENT_ID,
      client_secret: env!.GOOGLE_CLIENT_SECRET,
      redirect_uri: env!.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const token = tokenResponse.data;

  const userResponse = await axios.get(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    },
  );
  const user = userResponse.data;
  return {
    name: user.name,
    email: user.email,
    picture: user.picture,
    accountType: accountType.Google,
    twoFactorEnabled: false,
  };
};
const oauthService = {
  getGithubURL,
  signinwithGithub,
  getGoogleURL,
  signinwithGoogle,
};
export default oauthService;
