const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS options
const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionSuccessStatus: 200
};

module.exports = {
  helmet: helmet(),
  cors: cors(corsOptions),
  limiter
};