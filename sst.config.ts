/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  version: '4.17.1',

  app() {
    return {
      name: 'storex',
      home: 'aws',
      providers: {
        aws: {
          region: process.env.AWS_REGION ?? 'eu-north-1',
        },
      },
    };
  },

  async run() {
    const secrets = {
      databaseUrl: new sst.Secret('DatabaseUrl'),
      redisUrl: new sst.Secret('RedisUrl'),
      accessSecret: new sst.Secret('AccessSecret'),
      smtpName: new sst.Secret('SmtpName'),
      smtpMail: new sst.Secret('SmtpMail'),
      smtpReplyTo: new sst.Secret('SmtpReplyTo'),
      smtpHost: new sst.Secret('SmtpHost'),
      smtpUsername: new sst.Secret('SmtpUsername'),
      smtpPassword: new sst.Secret('SmtpPassword'),
      githubClientId: new sst.Secret('GithubClientId'),
      githubClientSecret: new sst.Secret('GithubClientSecret'),
      googleClientId: new sst.Secret('GoogleClientId'),
      googleClientSecret: new sst.Secret('GoogleClientSecret'),
      stripeSecretKey: new sst.Secret('StripeSecretKey'),
      stripeWebhookSecret: new sst.Secret('StripeWebhookSecret'),
      stripeProPriceId: new sst.Secret('StripeProPriceId'),
      stripeUltraPriceId: new sst.Secret('StripeUltraPriceId'),
      fgaApiUrl: new sst.Secret('FgaApiUrl'),
      fgaStoreId: new sst.Secret('FgaStoreId'),
      fgaModelId: new sst.Secret('FgaModelId'),
      fgaTokenIssuer: new sst.Secret('FgaApiTokenIssuer'),
      fgaAudience: new sst.Secret('FgaApiAudience'),
      fgaClientId: new sst.Secret('FgaClientId'),
      fgaClientSecret: new sst.Secret('FgaClientSecret'),
    };

    // Hono handles credentialed CORS with the exact frontend origin.
    // Disable API Gateway's default wildcard CORS so it does not override
    // Access-Control-Allow-Origin and Access-Control-Allow-Credentials.
    const api = new sst.aws.ApiGatewayV2('Api', {
      cors: false,
      transform: {
        // SST 4.17.1 normalizes `cors: false` to an empty CORS object.
        // Remove the object entirely so API Gateway passes through Hono's
        // exact-origin credentialed CORS headers.
        api: (args) => {
          args.corsConfiguration = undefined;
        },
      },
    });

    const web = new sst.aws.StaticSite('Web', {
      path: 'apps/ui',
      build: { command: 'pnpm build', output: 'dist' },
      environment: {
        VITE_BASE_BACKEND_URL: $interpolate`${api.url}/api`,
      },
    });

    const uploads = new sst.aws.Bucket('Uploads', {
      access: 'public',
      cors: {
        allowHeaders: ['*'],
        allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        allowOrigins: [web.url],
        exposeHeaders: ['ETag'],
        maxAge: '1 day',
      },
    });

    const emailDeadLetterQueue = new sst.aws.Queue('SignupEmailDLQ');
    const emailQueue = new sst.aws.Queue('SignupEmailQueue', {
      visibilityTimeout: '2 minutes',
      dlq: { queue: emailDeadLetterQueue.arn, retry: 5 },
    });

    const environment = {
      NODE_ENV: 'production',
      ALLOWED_ORIGINS: web.url,
      APP_URL: web.url,
      DATABASE_URL: secrets.databaseUrl.value,
      REDIS_URL: secrets.redisUrl.value,
      ACCESS_SECRET: secrets.accessSecret.value,
      ACCESS_SECRET_TTL: '1d',
      ACCESS_SECRET_TTL_S: '86400',
      SMTP_NAME: secrets.smtpName.value,
      SMTP_MAIL: secrets.smtpMail.value,
      SMTP_REPLY_TO: secrets.smtpReplyTo.value,
      SMTP_HOST: secrets.smtpHost.value,
      SMTP_PORT: '587',
      SMTP_USERNAME: secrets.smtpUsername.value,
      SMTP_PASSWORD: secrets.smtpPassword.value,
      BUCKET_NAME: uploads.name,
      SQS_EMAIL_QUEUE_URL: emailQueue.url,
      GITHUB_CLIENT_ID: secrets.githubClientId.value,
      GITHUB_CLIENT_SECRET: secrets.githubClientSecret.value,
      GITHUB_REDIRECT_URI: $interpolate`${api.url}/api/auth/callback/github`,
      GOOGLE_CLIENT_ID: secrets.googleClientId.value,
      GOOGLE_CLIENT_SECRET: secrets.googleClientSecret.value,
      GOOGLE_REDIRECT_URI: $interpolate`${api.url}/api/auth/callback/google`,
      STRIPE_SECRET_KEY: secrets.stripeSecretKey.value,
      STRIPE_WEBHOOK_SECRET: secrets.stripeWebhookSecret.value,
      STRIPE_PRO_PRICE_ID: secrets.stripeProPriceId.value,
      STRIPE_ULTRA_PRICE_ID: secrets.stripeUltraPriceId.value,
      FGA_API_URL: secrets.fgaApiUrl.value,
      FGA_STORE_ID: secrets.fgaStoreId.value,
      FGA_MODEL_ID: secrets.fgaModelId.value,
      FGA_API_TOKEN_ISSUER: secrets.fgaTokenIssuer.value,
      FGA_API_AUDIENCE: secrets.fgaAudience.value,
      FGA_CLIENT_ID: secrets.fgaClientId.value,
      FGA_CLIENT_SECRET: secrets.fgaClientSecret.value,
    };

    const apiFunction = new sst.aws.Function('ApiFunction', {
      handler: 'apps/api/src/lambda.handler',
      runtime: 'nodejs22.x',
      memory: '1024 MB',
      timeout: '30 seconds',
      logging: { retention: '1 month' },
      link: [uploads, emailQueue],
      environment,
    });

    api.route('$default', apiFunction.arn);

    emailQueue.subscribe(
      {
        handler: 'apps/api/src/workers/signupEmail.lambda.handler',
        runtime: 'nodejs22.x',
        memory: '512 MB',
        timeout: '1 minute',
        logging: { retention: '1 month' },
        environment,
      },
      { batch: { size: 10, partialResponses: true } },
    );

    new sst.aws.CronV2('TrashCleanup', {
      enabled: $app.stage === 'production',
      schedule: 'rate(1 day)',
      retries: 2,
      function: {
        handler: 'apps/api/src/jobs/trashCleanup.lambda.handler',
        runtime: 'nodejs22.x',
        memory: '1024 MB',
        timeout: '5 minutes',
        logging: { retention: '1 month' },
        link: [uploads],
        environment,
      },
    });

    return {
      apiUrl: api.url,
      webUrl: web.url,
      uploadsBucket: uploads.name,
      signupEmailQueue: emailQueue.url,
      signupEmailDeadLetterQueue: emailDeadLetterQueue.url,
    };
  },
});
