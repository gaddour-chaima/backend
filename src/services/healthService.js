const mongoose = require('mongoose');

class HealthService {
  static async getHealthStatus() {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    let databaseStatus = 'disconnected';
    if (mongoose.connection.readyState === 1) {
      databaseStatus = 'connected';
    }

    return {
      status: 'ok',
      timestamp,
      uptime: Math.floor(uptime),
      database: databaseStatus,
      websocket: 'running',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

module.exports = HealthService;