import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { kmsDecrypt, kmsEncrypt } from '../ai/kms.js';
import { evolveCode } from '../ai/self-evolving.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_for_dev_only';
const AUTH_ENABLED = process.env.GRPC_AUTH_ENABLED === 'true';

// Simple Rate Limiter for AI Ops
const rateLimits = new Map();
const LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;    // 10 requests per minute

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userLimit = rateLimits.get(userId) || { count: 0, startTime: now };

  if (now - userLimit.startTime > LIMIT_WINDOW) {
    userLimit.count = 1;
    userLimit.startTime = now;
    rateLimits.set(userId, userLimit);
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  rateLimits.set(userId, userLimit);
  return true;
};

const PROTO_PATH = path.join(__dirname, '../proto/agent.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const agentProto = grpc.loadPackageDefinition(packageDefinition).agent;

// Helper to verify JWT from metadata
const authenticate = (call) => {
  if (!AUTH_ENABLED) return { success: true, userId: 'anonymous' };

  const metadata = call.metadata.get('authorization');
  if (!metadata || metadata.length === 0) {
    return { success: false };
  }

  const token = metadata[0].split(' ')[1]; // Bearer <token>
  if (!token) return { success: false };

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, userId: decoded.userId || 'unknown' };
  } catch (err) {
    return { success: false };
  }
};

const sendTask = async (call, callback) => {
  const auth = authenticate(call);
  if (!auth.success) {
    return callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid or missing authentication token'
    });
  }

  if (!checkRateLimit(auth.userId)) {
    return callback({
      code: grpc.status.RESOURCE_EXHAUSTED,
      details: 'Rate limit exceeded for AI operations'
    });
  }

  try {
    const { task_id, payload } = call.request;
    
    // Decrypt the payload using KMS
    const decryptedPayload = kmsDecrypt(payload);
    
    console.log(`[gRPC] Processing task ${task_id}:`, decryptedPayload);
    const resultData = `Processed: ${decryptedPayload}`;
    
    // Encrypt the result
    const encryptedResult = kmsEncrypt(resultData);
    
    callback(null, {
      task_id,
      result: encryptedResult,
      success: true
    });
  } catch (error) {
    console.error('[gRPC] Error processing task:', error);
    callback(null, {
      task_id: call.request.task_id,
      result: kmsEncrypt(`Error: ${error.message}`),
      success: false
    });
  }
};

const evolveCodeRpc = async (call, callback) => {
  const auth = authenticate(call);
  if (!auth.success) {
    return callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid or missing authentication token'
    });
  }

  if (!checkRateLimit(auth.userId)) {
    return callback({
      code: grpc.status.RESOURCE_EXHAUSTED,
      details: 'Rate limit exceeded for AI operations'
    });
  }

  try {
    const { file_path, instruction } = call.request;
    console.log(`[gRPC] Received evolve request for ${file_path}`);
    
    const { success, newHash } = await evolveCode(file_path, instruction);
    
    callback(null, {
      file_path,
      success,
      new_code_hash: newHash || ''
    });
  } catch (error) {
    console.error('[gRPC] Error evolving code:', error);
    callback(null, {
      file_path: call.request.file_path,
      success: false,
      new_code_hash: ''
    });
  }
};

export const startGrpcServer = (port = 50051) => {
  const server = new grpc.Server();
  server.addService(agentProto.AgentCommunication.service, {
    SendTask: sendTask,
    EvolveCode: evolveCodeRpc
  });
  
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error('[gRPC] Server bind failed:', err);
      return;
    }
    console.log(`[gRPC] Agent Server running on port ${boundPort}`);
  });
  
  return server;
};
