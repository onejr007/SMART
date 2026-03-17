import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Optimization #7 & #39
app.use(helmet());
app.use(compression());

// Serve static files with caching
app.use(express.static(__dirname, { maxAge: '1d' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Hardened Production server running on port ${PORT}`);
});