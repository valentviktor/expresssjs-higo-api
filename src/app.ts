import express, { Application } from 'express';
import cors from 'cors';
import customerRoutes from './routes/customerRoutes';

const app: Application = express();

app.use(express.json());
app.use(cors());

app.use('/api', customerRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;