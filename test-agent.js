import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { kmsEncrypt, kmsDecrypt } from './ai/kms.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, 'proto/agent.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const agentProto = grpc.loadPackageDefinition(packageDefinition).agent;

const client = new agentProto.AgentCommunication(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const runTests = () => {
  console.log('--- TEST KMS ---');
  const secret = 'Ini adalah pesan rahasia agent';
  const encrypted = kmsEncrypt(secret);
  const decrypted = kmsDecrypt(encrypted);
  console.log('Original:', secret);
  console.log('Encrypted:', encrypted);
  console.log('Decrypted:', decrypted);
  console.log('KMS Test Success:', secret === decrypted);

  console.log('\n--- TEST gRPC SendTask ---');
  client.SendTask({
    task_id: 'task-1001',
    payload: encrypted
  }, (err, response) => {
    if (err) {
      console.error('gRPC Error:', err);
      return;
    }
    console.log('gRPC Response:', response);
    console.log('Decrypted Result:', kmsDecrypt(response.result));

    console.log('\n--- TEST gRPC EvolveCode ---');
    client.EvolveCode({
      file_path: 'test-evolve.txt',
      instruction: 'add logging'
    }, (err, response) => {
      if (err) {
        console.error('gRPC Error:', err);
        return;
      }
      console.log('gRPC Evolve Response:', response);
    });
  });
};

runTests();