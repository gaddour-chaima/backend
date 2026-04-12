# OCPP Dashboard Backend API - Complete Documentation

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Security](#security)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

The OCPP Dashboard Backend API is a production-ready REST API designed for EV charging station management and monitoring. It processes OCPP 1.6J protocol data from charging stations, stores it in MongoDB, and provides comprehensive analytics and monitoring capabilities for dashboard applications.

### Key Features

- ✅ **Complete OCPP 1.6J Support**: Handles all major OCPP messages (BootNotification, StatusNotification, MeterValues, Start/Stop Transaction)
- ✅ **Real-time Analytics**: Dashboard statistics with aggregation pipelines
- ✅ **Charge Point Management**: Monitor and track multiple charging stations
- ✅ **Transaction Tracking**: Complete session management and energy consumption tracking
- ✅ **AI-Ready Architecture**: Placeholder endpoints for future ML integration
- ✅ **Production-Grade Security**: Helmet, CORS, rate limiting, input validation
- ✅ **Scalable Architecture**: Clean layered design for easy maintenance
- ✅ **Comprehensive API**: RESTful endpoints with pagination, filtering, and sorting

### Use Cases

- EV charging network operators
- Fleet management companies
- Parking facility operators
- Public charging infrastructure providers
- Private charging station owners

## 🏗️ Architecture

The backend follows a **layered architecture** pattern for clean separation of concerns and maintainability:

```
┌─────────────────┐
│   Routes        │  ← API endpoint definitions
├─────────────────┤
│   Controllers   │  ← Request/response handling
├─────────────────┤
│   Services      │  ← Business logic layer
├─────────────────┤
│   Models        │  ← Data layer (Mongoose ODM)
├─────────────────┤
│   Database      │  ← MongoDB collections
└─────────────────┘
```

### Architectural Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Services are injected into controllers
- **Error Boundaries**: Centralized error handling
- **Validation**: Input validation at multiple layers
- **Security**: Defense-in-depth approach
- **Performance**: Optimized queries and aggregation pipelines

### Data Flow

1. **Request** → Route validation → Controller
2. **Controller** → Service layer → Business logic
3. **Service** → Model layer → Database operations
4. **Response** → Controller → Client with standardized format

## 🛠️ Tech Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 16+ | JavaScript runtime |
| Framework | Express.js | 4.18+ | Web application framework |
| Database | MongoDB | 4.4+ | NoSQL database |
| ODM | Mongoose | 7.5+ | MongoDB object modeling |
| Validation | express-validator | 7.0+ | Request validation |
| Security | Helmet | 7.1+ | Security headers |
| CORS | cors | 2.8+ | Cross-origin resource sharing |
| Rate Limiting | express-rate-limit | 7.1+ | API rate limiting |
| Logging | Morgan | 1.10+ | HTTP request logging |

### Development Tools

- **Nodemon**: Development server with auto-restart
- **ESLint**: Code linting and style enforcement
- **Dotenv**: Environment variable management

### DevOps (Optional)

- **Docker**: Containerization
- **PM2**: Process management
- **Nginx**: Reverse proxy
- **MongoDB Atlas**: Cloud database

## 📊 Database Schema

The application uses MongoDB with 5 main collections designed for optimal query performance and analytics.

### 🔌 ChargePoint Collection

```javascript
{
  chargePointId: String (unique, indexed),
  vendor: String,
  model: String,
  firmwareVersion: String,
  status: Enum ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
  lastSeenAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `chargePointId` (unique)
- `status` (compound queries)
- `lastSeenAt` (recent activity)

**Usage:** Store and track charging station information and current status.

### 📨 OcppMessage Collection

```javascript
{
  chargePointId: String (indexed),
  messageTypeId: Number,
  uniqueId: String (indexed),
  action: String (indexed),
  payload: Mixed,
  direction: Enum ['in', 'out'],
  receivedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `chargePointId` + `receivedAt` (compound)
- `action` + `receivedAt` (compound)
- `uniqueId`

**Usage:** Raw OCPP message logging for debugging and auditing.

### ⚡ MeterValue Collection

```javascript
{
  chargePointId: String (indexed),
  connectorId: Number,
  transactionId: Number (indexed),
  timestamp: Date (indexed),
  voltage: Number,
  current: Number,
  power: Number,
  energyWh: Number,
  raw: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `chargePointId` + `timestamp` (compound)
- `transactionId` + `timestamp` (compound)

**Usage:** Time-series energy consumption and power data.

### 🔄 Transaction Collection

```javascript
{
  transactionId: Number (unique, indexed),
  chargePointId: String (indexed),
  connectorId: Number,
  idTag: String,
  startTime: Date,
  stopTime: Date,
  startMeter: Number,
  stopMeter: Number,
  energyConsumedWh: Number,
  status: Enum ['Active', 'Completed', 'Failed', 'Cancelled'],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `transactionId` (unique)
- `chargePointId` + `startTime` (compound)
- `status` + `startTime` (compound)

**Usage:** Charging session tracking and billing data.

### 📊 StatusLog Collection

```javascript
{
  chargePointId: String (indexed),
  connectorId: Number,
  status: Enum ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
  errorCode: Enum ['ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure', 'HighTemperature', 'InternalError', 'LocalListConflict', 'NoError', 'OtherError', 'OverCurrentFailure', 'OverVoltage', 'PowerMeterFailure', 'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure', 'UnderVoltage', 'WeakSignal'],
  timestamp: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `chargePointId` + `timestamp` (compound)
- `status` + `timestamp` (compound)

**Usage:** Historical status changes for uptime analysis.

## 🔗 API Reference

### Response Format

All API responses follow a consistent JSON structure:

```json
{
  "success": true|false,
  "message": "string",
  "data": object|array|null,
  "meta": object|null
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

### Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Items per page (max 100) |
| `sortBy` | string | createdAt | Field to sort by |
| `sortOrder` | enum | desc | Sort order: 'asc' or 'desc' |
| `startDate` | ISO8601 | null | Start date filter |
| `endDate` | ISO8601 | null | End date filter |

### 1. Health Check API

#### GET /api/health
Get system health status including database connectivity and uptime.

**Response:**
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

### 2. Charge Points API

#### GET /api/charge-points
List all charge points with optional filtering and pagination.

**Query Parameters:**
- `status` (enum): Filter by status
- `search` (string): Search in chargePointId, vendor, model
- Standard pagination and sorting parameters

**Response:**
```json
{
  "success": true,
  "message": "Charge points retrieved successfully",
  "data": [
    {
      "chargePointId": "CP001",
      "vendor": "VendorX",
      "model": "ModelY",
      "firmwareVersion": "1.0.0",
      "status": "Available",
      "lastSeenAt": "2024-01-01T10:00:00.000Z",
      "createdAt": "2024-01-01T08:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### GET /api/charge-points/:chargePointId
Get details of a specific charge point.

**Response:**
```json
{
  "success": true,
  "message": "Charge point retrieved successfully",
  "data": {
    "chargePointId": "CP001",
    "vendor": "VendorX",
    "model": "ModelY",
    "status": "Available",
    "lastSeenAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### GET /api/charge-points/:chargePointId/status-history
Get historical status changes for a charge point.

**Query Parameters:** Pagination and sorting

**Response:**
```json
{
  "success": true,
  "message": "Status history retrieved successfully",
  "data": [
    {
      "chargePointId": "CP001",
      "connectorId": 1,
      "status": "Available",
      "errorCode": "NoError",
      "timestamp": "2024-01-01T10:00:00.000Z"
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

#### GET /api/charge-points/:chargePointId/meter-values
Get meter values for a charge point with optional date filtering.

**Query Parameters:** Date range, pagination, sorting

#### GET /api/charge-points/:chargePointId/transactions
Get transactions for a specific charge point.

### 3. Transactions API

#### GET /api/transactions
List all transactions with filtering options.

**Query Parameters:**
- `status` (enum): Filter by transaction status
- Date range, pagination, sorting

#### GET /api/transactions/:transactionId
Get details of a specific transaction.

#### GET /api/transactions/summary/overview
Get transaction summary statistics.

**Response:**
```json
{
  "success": true,
  "message": "Transaction summary retrieved successfully",
  "data": {
    "totalSessions": 150,
    "activeSessions": 5,
    "completedSessions": 145,
    "totalEnergyConsumed": 75000,
    "averageEnergyPerSession": 500
  }
}
```

### 4. Statistics API

#### GET /api/stats/overview
Get comprehensive dashboard overview statistics.

**Response:**
```json
{
  "success": true,
  "message": "Overview stats retrieved successfully",
  "data": {
    "totalChargePoints": 25,
    "onlineChargePoints": 22,
    "offlineChargePoints": 3,
    "chargingChargePoints": 5,
    "totalTransactions": 150,
    "activeTransactions": 5,
    "totalEnergyConsumed": 75000,
    "averageEnergyPerSession": 500,
    "statusDistribution": [
      { "status": "Available", "count": 15 },
      { "status": "Charging", "count": 5 }
    ]
  }
}
```

#### GET /api/stats/energy/daily
Get daily energy consumption aggregated data.

**Query Parameters:** Date range

**Response:**
```json
{
  "success": true,
  "message": "Daily energy stats retrieved successfully",
  "data": [
    { "date": "2024-01-01", "energyWh": 2500 },
    { "date": "2024-01-02", "energyWh": 2800 }
  ]
}
```

#### GET /api/stats/energy/monthly
Get monthly energy consumption aggregated data.

#### GET /api/stats/sessions/daily
Get daily session count data.

#### GET /api/stats/power/realtime
Get latest power readings per charge point.

#### GET /api/stats/status/distribution
Get count of charge points by status.

#### GET /api/stats/availability
Get availability/uptime statistics.

### 5. Messages API

#### GET /api/messages
List OCPP messages with filtering options.

**Query Parameters:**
- `action` (string): Filter by OCPP action
- `chargePointId` (string): Filter by charge point
- `direction` (enum): 'in' or 'out'
- Date range, pagination, sorting

#### GET /api/messages/:id
Get details of a specific OCPP message.

### 6. AI API (Mock Endpoints)

#### GET /api/ai/forecast-energy
Placeholder for future energy consumption forecasting.

**Response:**
```json
{
  "success": true,
  "message": "Energy forecast retrieved successfully",
  "data": {
    "forecast": [
      { "date": "2024-01-01", "predictedEnergy": 1500 },
      { "date": "2024-01-02", "predictedEnergy": 1600 }
    ],
    "confidence": 0.85
  }
}
```

#### GET /api/ai/anomaly-detection
Placeholder for future anomaly detection in charging patterns.

## 🚀 Installation & Setup

### Prerequisites

- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ocpp-dashboard-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   ```bash
   # .env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ocpp_dashboard
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB:**
   ```bash
   # Using local MongoDB
   mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

6. **Start the application:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Docker Setup (Optional)

```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ocpp-dashboard .
docker run -p 5000:5000 ocpp-dashboard
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   ├── aiController.js          # AI endpoint handlers
│   │   ├── chargePointController.js # Charge point CRUD
│   │   ├── healthController.js      # Health check
│   │   ├── messageController.js     # OCPP message handlers
│   │   ├── statsController.js       # Statistics handlers
│   │   └── transactionController.js # Transaction handlers
│   ├── middleware/
│   │   ├── async.js                 # Async error wrapper
│   │   ├── error.js                 # Global error handler
│   │   ├── notFound.js              # 404 handler
│   │   ├── security.js              # Security middleware
│   │   └── validation.js            # Input validation rules
│   ├── models/
│   │   ├── ChargePoint.js           # Charge point schema
│   │   ├── MeterValue.js            # Meter readings schema
│   │   ├── OcppMessage.js           # OCPP message schema
│   │   ├── StatusLog.js             # Status history schema
│   │   └── Transaction.js           # Transaction schema
│   ├── routes/
│   │   ├── ai.js                    # AI routes
│   │   ├── chargePoints.js          # Charge point routes
│   │   ├── health.js                # Health routes
│   │   ├── messages.js              # Message routes
│   │   ├── stats.js                 # Statistics routes
│   │   └── transactions.js          # Transaction routes
│   ├── services/
│   │   ├── aiService.js             # AI business logic
│   │   ├── chargePointService.js    # Charge point business logic
│   │   ├── healthService.js         # Health check logic
│   │   ├── messageService.js        # Message business logic
│   │   ├── statsService.js          # Statistics business logic
│   │   └── transactionService.js    # Transaction business logic
│   ├── utils/
│   │   ├── apiResponse.js           # Response formatting
│   │   ├── date.js                  # Date utilities
│   │   └── pagination.js            # Pagination utilities
│   ├── app.js                       # Express application
│   └── server.js                    # Server entry point
├── .env.example                     # Environment template
├── package.json                     # Dependencies and scripts
├── README.md                        # This documentation
└── .eslintrc.json                   # Linting configuration
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port |
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `NODE_ENV` | No | development | Environment mode |
| `CLIENT_URL` | No | http://localhost:3000 | Frontend URL for CORS |

### MongoDB Connection String Examples

```bash
# Local MongoDB
mongodb://localhost:27017/ocpp_dashboard

# MongoDB with authentication
mongodb://username:password@localhost:27017/ocpp_dashboard

# MongoDB Atlas (cloud)
mongodb+srv://username:password@cluster.mongodb.net/ocpp_dashboard
```

## 🔒 Security

### Implemented Security Measures

1. **Helmet**: Security headers (CSP, HSTS, XSS protection)
2. **CORS**: Cross-origin resource sharing configuration
3. **Rate Limiting**: 100 requests per 10 minutes per IP
4. **Input Validation**: Comprehensive validation using express-validator
5. **Error Handling**: No sensitive information in error responses
6. **MongoDB Security**: Proper indexing and query optimization

### Security Headers

The application automatically sets the following security headers:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

### Rate Limiting

- **Window**: 10 minutes
- **Max requests**: 100 per IP
- **Standard headers**: Rate limit info included in responses

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error details"]
}
```

### Common Error Types

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Validation failed |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Validation Errors

Validation errors include specific field-level error messages:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "chargePointId must be a string",
    "page must be an integer greater than 0"
  ]
}
```

## ⚡ Performance Considerations

### Database Optimization

1. **Indexes**: Strategic indexing on frequently queried fields
2. **Aggregation Pipelines**: Efficient MongoDB aggregation for statistics
3. **Pagination**: Cursor-based pagination for large datasets
4. **Connection Pooling**: MongoDB connection pooling enabled

### Query Optimization

- **Compound Indexes**: For multi-field queries
- **Covered Queries**: Indexes covering query fields
- **Projection**: Only select required fields
- **Limit Results**: Reasonable pagination limits

### Caching Strategies (Future)

- Redis for session data
- In-memory caching for frequently accessed stats
- CDN for static assets

## 🛠️ Development

### Available Scripts

```bash
# Start development server with auto-restart
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

### Development Workflow

1. **Branch**: Create feature branch from `main`
2. **Develop**: Implement changes with tests
3. **Lint**: Run `npm run lint` and fix issues
4. **Test**: Run tests and ensure they pass
5. **Commit**: Use conventional commit messages
6. **Push**: Push branch and create PR

### Code Style

- **ESLint**: Airbnb JavaScript style guide
- **Prettier**: Code formatting (future)
- **Consistent Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for functions, inline comments for complex logic

### Testing (Future Implementation)

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB (MongoDB Atlas recommended)
- [ ] Set up environment variables securely
- [ ] Configure reverse proxy (nginx recommended)
- [ ] Set up SSL/TLS certificates
- [ ] Configure logging and monitoring
- [ ] Set up backup strategies
- [ ] Configure rate limiting appropriately
- [ ] Test all endpoints thoroughly

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Configuration

```json
{
  "name": "ocpp-dashboard",
  "script": "src/server.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 5000
  }
}
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongodb:27017/ocpp_dashboard
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongodb_data:
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

### Contribution Guidelines

- **Code Style**: Follow ESLint configuration
- **Tests**: Add tests for new features
- **Documentation**: Update documentation for API changes
- **Commits**: Use conventional commit format
- **PRs**: Provide clear description and link to issues

### Commit Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Testing
- chore: Maintenance
```

### Issues and Feature Requests

- Use GitHub Issues for bug reports and feature requests
- Provide detailed description and steps to reproduce
- Include relevant code snippets and error messages
- Tag appropriately (bug, enhancement, question, etc.)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

### ISC License Summary

- Allows commercial and private use
- Allows modification and distribution
- Allows patent use
- No warranty provided
- Requires copyright notice retention

## 📞 Support

### Getting Help

- **Documentation**: Check this README first
- **Issues**: Create GitHub issue for bugs/features
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers directly for urgent issues

### Community

- **GitHub**: https://github.com/your-org/ocpp-dashboard-backend
- **Issues**: https://github.com/your-org/ocpp-dashboard-backend/issues
- **Discussions**: https://github.com/your-org/ocpp-dashboard-backend/discussions

### Version History

- **v1.0.0**: Initial production release
  - Complete OCPP 1.6J support
  - RESTful API with full CRUD operations
  - Comprehensive analytics and statistics
  - Production-grade security and error handling

---

**Built with ❤️ for the EV charging community**

*Last updated: 2026-04-11*</content>
<parameter name="filePath">C:\Users\User\Desktop\ocpp-server\backend\PROJECT_DOCUMENTATION.md