const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy (for rate limiting behind nginx/load balancer)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Razorpay webhook needs raw body - register BEFORE json middleware
app.post('/api/adsets/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/adset').webhookHandler || ((req, res, next) => {
    req.rawBody = req.body;
    req.body = JSON.parse(req.body);
    next();
  }),
  (req, res, next) => next()
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection sanitization
app.use(mongoSanitize());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/businesses', require('./routes/business'));
app.use('/api/adsets', require('./routes/adset'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/digital-posters', require('./routes/digitalPoster'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/blogs', require('./routes/blog'));
app.use('/api/referrals', require('./routes/referral'));
app.use('/api/support', require('./routes/support'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/certificates', require('./routes/certificate'));

app.get('/', (req, res) => res.json({ success: true, message: 'JustService24 API running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
