import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'HematKu API', timestamp: new Date() });
});

// API Info endpoint
app.get('/api-info', (req, res) => {
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

// Serve Static Frontend Assets (Vite production build)
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Mount API Routes
app.use('/api', routes);

// SPA Fallback (Express 5 compatible): Any unmatched GET request returns index.html
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/api-info') {
        return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
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
    }
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
