import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { authRouter } from './routes/auth';
import { authMiddleware } from './lib/middleware/auth';
import { errorHandler } from './lib/middleware/error';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Routes
app.use('/api/v1', apiRouter);

// Mount auth routes directly
app.use('/api/v1/auth', authRouter);

// Protected routes middleware
app.use(authMiddleware);

// Error handling
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Print all registered routes
  console.log('Registered routes:');
  function print(path: string, layer: any) {
    if (layer.route) {
      layer.route.stack.forEach((route: any) => {
        console.log('%s %s', route.method.toUpperCase(), path.concat(route.route?.path || ''));
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach((stackItem: any) => {
        print(path.concat(layer.regexp.source.replace("^", "").replace("/?(?=\\/|$)", "")), stackItem);
      });
    }
  }
  
  app._router.stack.forEach((layer: any) => {
    print('', layer);
  });
});
