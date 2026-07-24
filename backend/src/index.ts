// Pet Care Backend Entry Point
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import healthRouter from './routes/health';
import playdateRouter from './routes/playdate';

export * from './types/health';
export * from './types/playdate';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/health', healthRouter);
app.use('/playdate', playdateRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server only if this is the main module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Pet Care Backend running on port ${PORT}`);
  });
}

export default app;
