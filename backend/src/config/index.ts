import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL!,
    apiKey: process.env.EVOLUTION_API_KEY!,
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'fortunecampus',
  },

  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://fortune-campus-8bmu.vercel.app',
        'http://localhost:5173',
        'http://localhost:5000'
      ];

      // Clean up FRONTEND_URL if it has a path
      if (process.env.FRONTEND_URL) {
        try {
          const url = new URL(process.env.FRONTEND_URL);
          allowedOrigins.push(`${url.protocol}//${url.host}`);
        } catch (e) {
          allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
        }
      }

      const isAllowed = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
      callback(null, isAllowed);
    },
    credentials: true,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
