import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

export const fgaClient = new OpenFgaClient({
  apiUrl: process.env.FGA_API_URL!,
  storeId: process.env.FGA_STORE_ID!,
  authorizationModelId: process.env.FGA_MODEL_ID!,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER!,
      apiAudience: process.env.FGA_API_AUDIENCE!,
      clientId: process.env.FGA_CLIENT_ID!,
      clientSecret: process.env.FGA_CLIENT_SECRET!,
    },
  },
});
