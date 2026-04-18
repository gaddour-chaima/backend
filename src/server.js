const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');
const mongoose = require('mongoose');
const db = require('./db');

// Load env vars
dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const OCPP_PATH = process.env.OCPP_PATH || '/ocpp';

// Connect to database
connectDB();

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
  console.log(`📡 REST API available at: http://${HOST}:${PORT}/api`);
  console.log(`🔌 WebSocket OCPP available at: ws://${HOST}:${PORT}${OCPP_PATH}`);
  console.log(`🌐 External access: ws://10.10.20.20:${PORT}${OCPP_PATH}`);
});

// =========================
// OCPP WebSocket Server Integration
// =========================

// Import models
const ChargePoint = require('./models/ChargePoint');
const OcppMessage = require('./models/OcppMessage');
const MeterValue = require('./models/MeterValue');
const Transaction = require('./models/Transaction');
const StatusLog = require('./models/StatusLog');

// WebSocket server for OCPP
const wss = new WebSocketServer({
  noServer: true
});

console.log(`WebSocket server initialized for OCPP upgrades`);

// Handle WebSocket upgrade requests
server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  const protocols = req.headers['sec-websocket-protocol'];

  // Check if the path starts with /ocpp/
  if (!url.startsWith(OCPP_PATH + '/')) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  // Check if the protocol includes ocpp1.6
  if (!protocols || !protocols.split(',').map(p => p.trim()).includes('ocpp1.6')) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  // Proceed with WebSocket upgrade
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// WebSocket server error handling
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

let cpCounter = 0;
let transactionCounter = 1000;

// Helper functions
function logInfo(...args) {
  console.log(new Date().toISOString(), "[INFO]", ...args);
}

function logError(...args) {
  console.error(new Date().toISOString(), "[ERROR]", ...args);
}

function generateChargePointId() {
  cpCounter += 1;
  return `CP_${cpCounter}`;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCallResult(uniqueId, payload) {
  return [3, uniqueId, payload];
}

async function saveMessage({
  chargePointId,
  messageTypeId,
  uniqueId,
  action,
  payload,
  direction
}) {
  await OcppMessage.create({
    chargePointId,
    messageTypeId,
    uniqueId,
    action,
    payload,
    direction
  });
}

function extractSampledValue(sampledValues = []) {
  const result = {
    voltage: null,
    current: null,
    power: null,
    energyWh: null
  };

  for (const item of sampledValues) {
    const measurand = item.measurand || "";
    const value = Number(item.value);

    if (Number.isNaN(value)) continue;

    // Handle different measurand formats for historical storage
    switch (measurand) {
      case "Voltage":
      case "Voltage.L1":
      case "Voltage.L2":
      case "Voltage.L3":
        result.voltage = value;
        break;
      case "Current.Import":
      case "Current":
        result.current = value;
        break;
      case "Power.Active.Import":
      case "Power.Active.Export":
      case "Power":
        result.power = value;
        break;
      case "Energy.Active.Import.Register":
      case "Energy.Active.Import":
      case "Energy":
        result.energyWh = value;
        break;
    }
  }

  return result;
}

// OCPP handlers
async function handleBootNotification(chargePointId, payload) {
  // Save to MongoDB
  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      chargePointId,
      vendor: payload.chargePointVendor || null,
      model: payload.chargePointModel || null,
      firmwareVersion: payload.firmwareVersion || null,
      status: "Available",
      lastSeen: new Date()
    },
    { upsert: true, new: true }
  );

  // Save to SQLite
  db.run('INSERT OR REPLACE INTO charge_points (id, vendor, model, firmwareVersion, status, lastSeen) VALUES (?, ?, ?, ?, ?, ?)', [
    chargePointId,
    payload.chargePointVendor || null,
    payload.chargePointModel || null,
    payload.firmwareVersion || null,
    'Available',
    new Date().toISOString()
  ]);

  return {
    status: "Accepted",
    currentTime: new Date().toISOString(),
    interval: 300
  };
}

async function handleHeartbeat(chargePointId) {
  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    { lastSeenAt: new Date() },
    { upsert: true, new: true }
  );

  return {
    currentTime: new Date().toISOString()
  };
}

async function handleStatusNotification(chargePointId, payload) {
  await StatusLog.create({
    chargePointId,
    connectorId: payload.connectorId ?? null,
    status: payload.status || "Unknown",
    errorCode: payload.errorCode || "NoError",
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
  });

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: payload.status || "Unknown",
      lastSeen: new Date()
    },
    { upsert: true, new: true }
  );

  // Update status in SQLite
  db.run('UPDATE charge_points SET status = ?, lastSeen = ? WHERE id = ?', [
    payload.status || "Unknown",
    new Date().toISOString(),
    chargePointId
  ]);

  return {};
}

async function handleMeterValues(chargePointId, payload) {
  const connectorId = payload.connectorId ?? null;
  const transactionId = payload.transactionId ?? null;
  const meterValueList = Array.isArray(payload.meterValue) ? payload.meterValue : [];

  // Process meter values for historical storage

  // Process each meter value in the list
  for (const mv of meterValueList) {
    const sampledValues = Array.isArray(mv.sampledValue) ? mv.sampledValue : [];
    const extracted = extractSampledValue(sampledValues);

    // Store historical meter value in database
    await MeterValue.create({
      chargePointId,
      connectorId,
      transactionId,
      timestamp: mv.timestamp ? new Date(mv.timestamp) : new Date(),
      voltage: extracted.voltage,
      current: extracted.current,
      power: extracted.power,
      energyWh: extracted.energyWh,
      raw: mv
    });
  }

  // Update ChargePoint last seen time
  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    { lastSeen: new Date() },
    { upsert: true, new: true, runValidators: false }
  );

  return {};
}

async function handleStartTransaction(chargePointId, payload) {
  transactionCounter += 1;
  const transactionId = transactionCounter;

  await Transaction.create({
    transactionId,
    chargePointId,
    connectorId: payload.connectorId ?? null,
    idTag: payload.idTag || null,
    startTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    startMeter: payload.meterStart ?? null,
    status: "Running"
  });

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: "Charging",
      lastSeen: new Date()
    },
    { upsert: true, new: true }
  );

  return {
    transactionId,
    idTagInfo: {
      status: "Accepted"
    }
  };
}

async function handleStopTransaction(chargePointId, payload) {
  const transactionId = payload.transactionId;

  const transaction = await Transaction.findOne({ transactionId });

  if (transaction) {
    transaction.stopTime = payload.timestamp ? new Date(payload.timestamp) : new Date();
    transaction.stopMeter = payload.meterStop ?? null;
    transaction.stopReason = payload.reason || null;
    transaction.energyConsumedWh =
      transaction.startMeter != null && payload.meterStop != null
        ? payload.meterStop - transaction.startMeter
        : null;
    transaction.status = "Completed";
    await transaction.save();
  }

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: "Available",
      lastSeen: new Date()
    },
    { upsert: true, new: true }
  );

  return {
    idTagInfo: {
      status: "Accepted"
    }
  };
}

async function handleAction(chargePointId, action, payload) {
  switch (action) {
    case "BootNotification":
      return handleBootNotification(chargePointId, payload);
    case "Heartbeat":
      return handleHeartbeat(chargePointId);
    case "StatusNotification":
      return handleStatusNotification(chargePointId, payload);
    case "MeterValues":
      return handleMeterValues(chargePointId, payload);
    case "StartTransaction":
      return handleStartTransaction(chargePointId, payload);
    case "StopTransaction":
      return handleStopTransaction(chargePointId, payload);
    default:
      logInfo(`Unhandled action: ${action}`);
      return {};
  }
}

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  const urlParts = req.url.split('/');
  const chargePointId = urlParts[2]; // /ocpp/<id>

  if (!chargePointId) {
    logError('Invalid OCPP URL: no charge point ID');
    ws.close();
    return;
  }

  console.log(`🔌 WebSocket connection established: ${chargePointId} from ${req.socket.remoteAddress}`);
  logInfo(`Charge point connected: ${chargePointId} from ${req.socket.remoteAddress}`);

  ws.on("message", async (data) => {
    const raw = data.toString();
    logInfo(`Received from ${chargePointId}: ${raw}`);

    const message = safeJsonParse(raw);

    if (!message || !Array.isArray(message)) {
      logError(`Invalid JSON frame from ${chargePointId}`);
      return;
    }

    const [messageTypeId, uniqueId, action, payload] = message;

    try {
      await saveMessage({
        chargePointId,
        messageTypeId,
        uniqueId,
        action: action || null,
        payload: payload || {},
        direction: "IN"
      });

      if (messageTypeId === 2) {
        const responsePayload = await handleAction(chargePointId, action, payload || {});
        const response = buildCallResult(uniqueId, responsePayload);

        ws.send(JSON.stringify(response));

        await saveMessage({
          chargePointId,
          messageTypeId: 3,
          uniqueId,
          action,
          payload: responsePayload,
          direction: "OUT"
        });

        logInfo(`Response sent to ${chargePointId}: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      logError(`Failed to process message from ${chargePointId}: ${error.message}`);
    }
  });

  ws.on("close", () => {
    logInfo(`Charge point disconnected: ${chargePointId}`);
  });

  ws.on("error", (error) => {
    logError(`WebSocket error from ${chargePointId}: ${error.message}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to Uncaught Exception');
  process.exit(1);
});