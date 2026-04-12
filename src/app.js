const express = require('express');
const morgan = require('morgan');
const { helmet, cors, limiter } = require('./middleware/security');
const db = require('./db');

// Route files
const health = require('./routes/health');
const chargePoints = require('./routes/chargePoints');
const transactions = require('./routes/transactions');
const stats = require('./routes/stats');
const messages = require('./routes/messages');
const ai = require('./routes/ai');

// Middleware
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet);
app.use(cors);

// Rate limiting
app.use(limiter);

// Mount routers
app.use('/api/health', health);
app.use('/api/charge-points', chargePoints);
app.use('/api/transactions', transactions);
app.use('/api/stats', stats);
app.use('/api/messages', messages);
app.use('/api/ai', ai);

// Additional REST API endpoints
app.get('/api/charge-points', (req, res) => {
  db.all('SELECT * FROM charge_points', (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows });
    }
  });
});

app.get('/api/charge-points/:id', (req, res) => {
  db.get('SELECT * FROM charge_points WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (!row) {
      res.status(404).json({ success: false, error: 'Charge point not found' });
    } else {
      res.json({ success: true, data: row });
    }
  });
});

app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions', (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows });
    }
  });
});

app.get('/api/stats/overview', (req, res) => {
  db.get('SELECT SUM(energy) as totalEnergy, SUM(sessions) as totalSessions, SUM(revenue) as totalRevenue FROM stats', (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: row });
    }
  });
});

app.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows });
    }
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;