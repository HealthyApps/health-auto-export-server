import cors from 'cors';
import express from 'express';

import mongodb from './database/mongodb';
import ingesterRouter from './routes/ingester';
import metricsRouter from './routes/metrics';
import workoutsRouter from './routes/workouts';
import { requireReadAuth, requireWriteAuth } from './middleware/auth';

const app = express();
const port = 3001;

mongodb.connect();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Apply write auth middleware to data ingestion routes
app.use('/api/data', requireWriteAuth, ingesterRouter);

// Apply read auth middleware to data retrieval routes
app.use('/api/metrics', requireReadAuth, metricsRouter);
app.use('/api/workouts', requireReadAuth, workoutsRouter);

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello world!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
