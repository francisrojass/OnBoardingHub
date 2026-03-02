import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SANDBOX_PORT_START: parseInt(process.env.SANDBOX_PORT_RANGE_START || '8100'),
  SANDBOX_PORT_END: parseInt(process.env.SANDBOX_PORT_RANGE_END || '8999'),
};
