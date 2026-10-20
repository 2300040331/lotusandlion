const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectRedis } = require('./config/redis');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

connectRedis();

const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://lotusandlion.in',
  'https://www.lotusandlion.in',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use('/api', apiLimiter);

app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Lotus & Lion API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/collections', require('./routes/collectionRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/cms', require('./routes/cmsRoutes'));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] Running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
    console.log('[DB] PostgreSQL connected');
  });
}
