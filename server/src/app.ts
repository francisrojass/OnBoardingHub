import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import boxRoutes from './modules/boxes/box.routes';
import sandboxRoutes from './modules/sandboxes/sandbox.routes';
import companyRoutes from './modules/companies/company.routes';

const app = express();

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/boxes', boxRoutes);
app.use('/api/v1/sandboxes', sandboxRoutes);
app.use('/api/v1/companies', companyRoutes);

app.use(errorHandler);

export default app;
