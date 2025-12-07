import express from 'express';
import bodyParser from 'body-parser';
import merchants from './routes/merchants';
import paymentIntents from './routes/paymentIntents';
import webhooks from './routes/webhooks';
import health from './routes/health';
import { errorHandler } from './middleware/errorHandler';

export const app = express();
app.use(bodyParser.json());
app.use('/merchants', merchants);
app.use('/payment-intents', paymentIntents);
app.use('/webhooks', webhooks);
app.use('/health', health);
app.use(errorHandler);
