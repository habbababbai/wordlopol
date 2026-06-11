import { Router } from 'express';

import { healthHandler } from '../../lib/health-handler.js';
import { authRouter } from '../auth.js';
import { dailyRouter } from '../daily.js';
import { infiniteRouter } from '../infinite.js';
import { userRouter } from '../user.js';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/daily', dailyRouter);
v1Router.use('/infinite', infiniteRouter);
v1Router.use('/user', userRouter);
v1Router.get('/health', healthHandler);
