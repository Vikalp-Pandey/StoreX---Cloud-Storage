import { Hono } from 'hono';
import oauthController from '@/controllers/authControllers/oauth.controller';

const oauth = new Hono();

oauth.get('/github', oauthController.getGithubURL);
oauth.get('/callback/github', oauthController.signinwithGithub);
oauth.get('/google', oauthController.getGoogleURL);
oauth.get('/callback/google', oauthController.signinwithGoogle);

export default oauth;
