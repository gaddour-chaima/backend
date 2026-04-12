# OCPP Dashboard Backend API

A production-ready REST API backend for EV charging dashboard with OCPP 1.6J data analytics and monitoring.

## Features

- Complete OCPP 1.6J data management
- Real-time statistics and analytics
- Charge point monitoring
- Transaction tracking
- AI-ready endpoints for future ML integration
- Production-grade security and performance
- Clean architecture with layered design

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication (future)
- **Docker** - Containerization (optional)

## Quick Start

### Prerequisites

- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment file:
   ```bash
   cp .env.example .env
   ```
5. Configure environment variables in `.env`
6. Start the server:
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/ocpp_dashboard |
| NODE_ENV | Environment mode | development |
| CLIENT_URL | Frontend URL for CORS | http://localhost:3000 |

## API Documentation

### Health Check

#### Get System Health
```http
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "Health check successful",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "database": "connected",
    "environment": "development"
  }
}
```

### Charge Points

#### List Charge Points
```http
GET /api/charge-points?page=1&limit=10&status=Available&sortBy=createdAt&sortOrder=desc
```

#### Get Charge Point Details
```http
GET /api/charge-points/CP001
```

#### Get Status History
```http
GET /api/charge-points/CP001/status-history?page=1&limit=10
```

#### Get Meter Values
```http
GET /api/charge-points/CP001/meter-values?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Transactions
```http
GET /api/charge-points/CP001/transactions?page=1&limit=10
```

### Transactions

#### List Transactions
```http
GET /api/transactions?page=1&limit=10&status=Completed&startDate=2024-01-01&endDate=2024-01-31
```

#### Get Transaction Details
```http
GET /api/transactions/12345
```

#### Get Transaction Summary
```http
GET /api/transactions/summary/overview
```

Response:
```json
{
  "success": true,
  "data": {
    "totalSessions": 150,
    "activeSessions": 5,
    "completedSessions": 145,
    "totalEnergyConsumed": 75000,
    "averageEnergyPerSession": 500
  }
}
```

### Dashboard Statistics

#### Overview Stats
```http
GET /api/stats/overview
```

#### Daily Energy Stats
```http
GET /api/stats/energy/daily?startDate=2024-01-01&endDate=2024-01-31
```

#### Monthly Energy Stats
```http
GET /api/stats/energy/monthly?startDate=2024-01-01&endDate=2024-12-31
```

#### Daily Session Stats
```http
GET /api/stats/sessions/daily?startDate=2024-01-01&endDate=2024-01-31
```

#### Real-time Power Stats
```http
GET /api/stats/power/realtime
```

#### Status Distribution
```http
GET /api/stats/status/distribution
```

#### Availability Stats
```http
GET /api/stats/availability
```

### OCPP Messages

#### List Messages
```http
GET /api/messages?page=1&limit=10&action=BootNotification&chargePointId=CP001&direction=in
```

#### Get Message Details
```http
GET /api/messages/507f1f77bcf86cd799439011
```

### AI Endpoints (Mock)

#### Energy Forecast
```http
GET /api/ai/forecast-energy
```

#### Anomaly Detection
```http
GET /api/ai/anomaly-detection
```

## Database Schema

### Collections

- **ChargePoint**: Charge point information and status
- **OcppMessage**: Raw OCPP messages
- **MeterValue**: Meter readings and measurements
- **Transaction**: Charging session data
- **StatusLog**: Status change history

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests (when implemented)
npm test
```

### Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── app.js           # Express app
│   └── server.js        # Server entry point
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Deployment

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB URI
- [ ] Set up proper logging
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts

### Docker (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

ISC License

## Support

For support, please contact the development team or create an issue in the repository.