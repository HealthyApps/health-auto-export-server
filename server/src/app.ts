import cors from 'cors';
import express from 'express';
import path from 'path';

import mongodb from './database/mongodb';
import ingesterRouter from './routes/ingester';
import metricsRouter from './routes/metrics';
import supplementsRouter from './routes/supplements';
import supplementLogsRouter from './routes/supplementLogs';
import supplementStackRouter from './routes/supplementStack';
import supplementInventoryRouter from './routes/supplementInventory';
import workoutLogRouter from './routes/workoutLog';
import workoutsRouter from './routes/workouts';
import { requireReadAuth, requireWriteAuth } from './middleware/auth';
import { migrateStackStatuses, processStackTransitions } from './stackLifecycle';

const app = express();
const port = 3001;

mongodb.connect().then(async () => {
  await migrateStackStatuses();

  // Process stack transitions every 60 seconds
  setInterval(() => {
    processStackTransitions().catch((err) =>
      console.error('[stack-lifecycle] Transition error:', err),
    );
  }, 60_000);
});

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Apply write auth middleware to data ingestion routes
app.use('/api/data', requireWriteAuth, ingesterRouter);

// Apply read auth middleware to data retrieval routes
app.use('/api/metrics', requireReadAuth, metricsRouter);
app.use('/api/workouts', requireReadAuth, workoutsRouter);
app.use('/api/workout-log', workoutLogRouter);

// Supplement tracker routes (auth applied per-route inside each file)
app.use('/api/supplements', supplementsRouter);
app.use('/api/supplement-logs', supplementLogsRouter);
app.use('/api/supplement-stack', supplementStackRouter);
app.use('/api/supplement-inventory', supplementInventoryRouter);

// Supplement tracker web UI — config endpoint injects API key so users don't have to enter it
app.get('/supplements/config.json', (req: express.Request, res: express.Response) => {
  res.json({ apiKey: process.env.WRITE_TOKEN || '' });
});
app.use('/supplements', express.static(path.resolve(__dirname, '../public')));

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Hello world!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
