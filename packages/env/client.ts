import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const env = createEnv({
  clientPrefix: 'VITE_',

  client: {
    VITE_BASE_BACKEND_URL: z.url(),
  },

  runtimeEnv: (import.meta as any).env,
});

export default env;
