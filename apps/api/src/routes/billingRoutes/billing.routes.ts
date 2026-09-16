import { Hono } from 'hono';
import { validateUser } from '@/middlewares/user.middleware';
import { checkout, currentSubscription, portal, webhook } from '@/controllers/billingControllers/billing.controller';

const billing = new Hono();

billing.post('/webhook', webhook);
billing.use('*', validateUser);
billing.get('/subscription', currentSubscription);
billing.post('/checkout', checkout);
billing.post('/portal', portal);

export default billing;
