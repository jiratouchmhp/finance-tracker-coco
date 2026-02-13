export const APP_CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'coco-tracker-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '7d',
  BCRYPT_SALT_ROUNDS: 10,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;
