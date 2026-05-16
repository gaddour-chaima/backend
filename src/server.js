const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');
const db = require('./db');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const OCPP_PATH = process.env.OCPP_PATH || '/ocpp';

connectDB();

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
  console.log(`📡 REST API available at: http://${HOST}:${PORT}/api`);
  console.log(`🔌 WebSocket OCPP available at: ws://${HOST}:${PORT}${OCPP_PATH}`);
  console.log(`🌐 External access: ws://10.10.20.20:${PORT}${OCPP_PATH}`);
});

const ChargePoint = require('./models/ChargePoint');
const OcppMessage = require('./models/OcppMessage');
const MeterValue = require('./models/MeterValue');
const Transaction = require('./models/Transaction');
const StatusLog = require('./models/StatusLog');

const wss = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => {
    if (protocols.has('ocpp1.6')) return 'ocpp1.6';
    if (protocols.has('ocpp1.6j')) return 'ocpp1.6j';
    return 'ocpp1.6';
  }
});

console.log('WebSocket server initialized for OCPP upgrades');

server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  const protocols = req.headers['sec-websocket-protocol'];

  console.log('========== OCPP DEBUG ==========');
  console.log('OCPP URL:', url);
  console.log('OCPP Protocols:', protocols);
  console.log('Remote IP:', req.socket.remoteAddress);
  console.log('================================');

  if (url !== OCPP_PATH && !url.startsWith(OCPP_PATH + '/')) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

let transactionCounter = 1000;

function logInfo(...args) {
  console.log(new Date().toISOString(), '[INFO]', ...args);
}

function logError(...args) {
  console.error(new Date().toISOString(), '[ERROR]', ...args);
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

function buildCallError(uniqueId, errorCode, errorDescription, errorDetails = {}) {
  return [4, uniqueId, errorCode, errorDescription, errorDetails];
}

async function saveMessage({ chargePointId, messageTypeId, uniqueId, action, payload, direction }) {
  try {
    await OcppMessage.create({
      chargePointId,
      messageTypeId,
      uniqueId,
      action,
      payload,
      direction
    });
  } catch (error) {
    logError('Save OCPP message error:', error.message);
  }
}

function extractSampledValue(sampledValues = []) {
  const result = {
    voltage: null,
    current: null,
    power: null,
    energyWh: null
  };

  for (const item of sampledValues) {
    const measurand = item.measurand || '';
    const value = Number(item.value);

    if (Number.isNaN(value)) continue;

    switch (measurand) {
      case 'Voltage':
      case 'Voltage.L1':
      case 'Voltage.L2':
      case 'Voltage.L3':
        result.voltage = value;
        break;

      case 'Current.Import':
      case 'Current':
        result.current = value;
        break;

      case 'Power.Active.Import':
      case 'Power.Active.Export':
      case 'Power':
        result.power = value;
        break;

      case 'Energy.Active.Import.Register':
      case 'Energy.Active.Import':
      case 'Energy':
        result.energyWh = value;
        break;
    }
  }

  return result;
}

async function handleBootNotification(chargePointId, payload) {
  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      chargePointId,
      vendor: payload.chargePointVendor || null,
      model: payload.chargePointModel || null,
      firmwareVersion: payload.firmwareVersion || null,
      serialNumber: payload.chargePointSerialNumber || null,
      status: 'Available',
      lastSeen: new Date()
    },
    { upsert: true, new: true, runValidators: false }
  );

  db.run(
    'INSERT OR REPLACE INTO charge_points (id, vendor, model, firmwareVersion, status, lastSeen) VALUES (?, ?, ?, ?, ?, ?)',
    [
      chargePointId,
      payload.chargePointVendor || null,
      payload.chargePointModel || null,
      payload.firmwareVersion || null,
      'Available',
      new Date().toISOString()
    ]
  );

  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300
  };
}

async function handleHeartbeat(chargePointId) {
  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      lastSeen: new Date(),
      lastSeenAt: new Date()
    },
    { upsert: true, new: true, runValidators: false }
  );

  return {
    currentTime: new Date().toISOString()
  };
}

async function handleStatusNotification(chargePointId, payload) {
  await StatusLog.create({
    chargePointId,
    connectorId: payload.connectorId ?? null,
    status: payload.status || 'Unknown',
    errorCode: payload.errorCode || 'NoError',
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
  });

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: payload.status || 'Unknown',
      lastSeen: new Date()
    },
    { upsert: true, new: true, runValidators: false }
  );

  db.run(
    'UPDATE charge_points SET status = ?, lastSeen = ? WHERE id = ?',
    [
      payload.status || 'Unknown',
      new Date().toISOString(),
      chargePointId
    ]
  );

  return {};
}

async function handleMeterValues(chargePointId, payload) {
  const connectorId = payload.connectorId ?? null;
  const transactionId = payload.transactionId ?? null;
  const meterValueList = Array.isArray(payload.meterValue) ? payload.meterValue : [];

  for (const mv of meterValueList) {
    const sampledValues = Array.isArray(mv.sampledValue) ? mv.sampledValue : [];
    const extracted = extractSampledValue(sampledValues);

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

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    { lastSeen: new Date() },
    { upsert: true, new: true, runValidators: false }
  );

  return {};
}

async function handleAuthorize() {
  return {
    idTagInfo: {
      status: 'Accepted'
    }
  };
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
    status: 'Running'
  });

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: 'Charging',
      lastSeen: new Date()
    },
    { upsert: true, new: true, runValidators: false }
  );

  return {
    transactionId,
    idTagInfo: {
      status: 'Accepted'
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
    transaction.status = 'Completed';

    await transaction.save();
  }

  await ChargePoint.findOneAndUpdate(
    { chargePointId },
    {
      status: 'Available',
      lastSeen: new Date()
    },
    { upsert: true, new: true, runValidators: false }
  );

  return {
    idTagInfo: {
      status: 'Accepted'
    }
  };
}

async function handleDataTransfer(payload) {
  console.log('📊 DataTransfer:', payload);

  return {
    status: 'Accepted'
  };
}

async function handleAction(chargePointId, action, payload) {
  switch (action) {
    case 'BootNotification':
      return handleBootNotification(chargePointId, payload);

    case 'Heartbeat':
      return handleHeartbeat(chargePointId);

    case 'StatusNotification':
      return handleStatusNotification(chargePointId, payload);

    case 'MeterValues':
      return handleMeterValues(chargePointId, payload);

    case 'Authorize':
      return handleAuthorize(chargePointId, payload);

    case 'StartTransaction':
      return handleStartTransaction(chargePointId, payload);

    case 'StopTransaction':
      return handleStopTransaction(chargePointId, payload);

    case 'DataTransfer':
      return handleDataTransfer(payload);

    default:
      logInfo(`Unhandled action: ${action}`);
      return {};
  }
}

wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  let chargePointId = urlParts[2];

  if (!chargePointId) {
    chargePointId = 'CP001';
    logInfo(`No ChargePointId provided in URL, using default: ${chargePointId}`);
  }

  console.log(`🔌 Charge point connected: ${chargePointId} from ${req.socket.remoteAddress}`);

  ws.on('message', async (data) => {
    const raw = data.toString();
    console.log('📩 OCPP IN:', raw);

    const message = safeJsonParse(raw);

    if (!message || !Array.isArray(message)) {
      logError(`Invalid OCPP JSON from ${chargePointId}`);
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
        direction: 'in'
      });

      if (messageTypeId === 2) {
        const responsePayload = await handleAction(chargePointId, action, payload || {});
        const response = buildCallResult(uniqueId, responsePayload);

        ws.send(JSON.stringify(response));

        console.log('📤 OCPP OUT:', JSON.stringify(response));

        await saveMessage({
          chargePointId,
          messageTypeId: 3,
          uniqueId,
          action,
          payload: responsePayload,
          direction: 'out'
        });
      }
    } catch (error) {
      logError(`Failed to process OCPP message from ${chargePointId}: ${error.message}`);

      if (messageTypeId === 2 && uniqueId) {
        const errorResponse = buildCallError(uniqueId, 'InternalError', error.message, {});
        ws.send(JSON.stringify(errorResponse));
      }
    }
  });

  ws.on('close', (code, reason) => {
    logInfo(`Charge point disconnected: ${chargePointId}, code=${code}, reason=${reason.toString()}`);
  });

  ws.on('error', (error) => {
    logError(`WebSocket error from ${chargePointId}: ${error.message}`);
  });
});

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
});

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down due to uncaught exception');
  process.exit(1);
});