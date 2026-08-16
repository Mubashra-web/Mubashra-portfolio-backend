require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// ---------- Core middleware ----------
// Increased limit (default is ~100kb) so base64-encoded project/profile
// pictures sent as JSON don't get rejected with a 413 Payload Too Large.
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS: locked to the single frontend origin (public site + admin panel are served together)
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5500';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------- Static files ----------
// Uploaded profile pictures etc. are served at http://<host>/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- API routes ----------
app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Portfolio backend is running. See /api/health.' });
});

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

// ---------- Start ----------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin (CORS): ${allowedOrigin}`);
  });
});

module.exports = app;