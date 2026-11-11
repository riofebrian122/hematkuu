import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'HematKu API', timestamp: new Date() });
});

// Root Info
app.get('/', (req, res) => {
    res.json({
        message: '🚀 HematKu Backend API is running on Vercel!',
        status: 'online',
        endpoints: {
            health: '/health',
            api: '/api',
            auth: '/api/auth',
            transactions: '/api/transactions'
        }
    });
});

// Mount API Routes
app.use('/api', routes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
