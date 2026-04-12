const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./ocpp.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS charge_points (
    id TEXT PRIMARY KEY,
    vendor TEXT,
    model TEXT,
    status TEXT,
    lastSeen DATETIME,
    firmwareVersion TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chargePointId TEXT,
    user TEXT,
    startTime DATETIME,
    endTime DATETIME,
    energy REAL,
    cost REAL,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    type TEXT,
    timestamp DATETIME,
    isRead BOOLEAN
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE,
    energy REAL,
    sessions INTEGER,
    revenue REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS meter_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chargePointId TEXT,
    connectorId INTEGER,
    transactionId INTEGER,
    timestamp DATETIME,
    voltage REAL,
    current REAL,
    power REAL,
    energyWh REAL
  )`);
});

module.exports = db;