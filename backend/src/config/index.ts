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
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /\.vercel\.app$/, // Allow all Vercel subdomains
      'https://fortune-campus-8bmu.vercel.app' // Direct allow for the current deployment
    ],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
