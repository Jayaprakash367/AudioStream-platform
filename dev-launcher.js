#!/usr/bin/env node
/**
 * Auralux X — No-Docker Dev Launcher
 *
 * Starts an in-memory MongoDB, then spawns all 11 microservices + the Next.js
 * frontend so the entire platform runs locally without Docker, Redis, or Kafka.
 *
 * Infrastructure:
 *   MongoDB  → mongodb-memory-server (in-process, no installation needed)
 *   Redis    → packages/redis-client uses an in-memory Map (no Redis server)
 *   Kafka    → packages/kafka-client uses Node.js EventEmitter (no Kafka server)
 *
 * Usage:
 *   node dev-launcher.js
 *   node dev-launcher.js --services-only   (skip frontend)
 *   node dev-launcher.js --frontend-only   (skip microservices)
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const args = process.argv.slice(2);
const SERVICES_ONLY = args.includes('--services-only');
const FRONTEND_ONLY = args.includes('--frontend-only');

// ANSI colour helpers
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  magenta:'\x1b[35m',
  blue:   '\x1b[34m',
};

const colors = [C.cyan, C.green, C.yellow, C.magenta, C.blue, C.red];
let colorIdx = 0;
function nextColor() { return colors[colorIdx++ % colors.length]; }

function log(tag, msg, color = C.reset) {
  const ts = new Date().toTimeString().slice(0, 8);
  console.log(`${C.bold}[${ts}]${C.reset} ${color}[${tag}]${C.reset} ${msg}`);
}

// ─── Service Definitions ─────────────────────────────────────────────────────

const SERVICES = [
  { name: 'api-gateway',          port: 3100, needsMongo: false },
  { name: 'auth-service',         port: 3001, needsMongo: true,  db: 'auralux_auth' },
  { name: 'user-service',         port: 3002, needsMongo: true,  db: 'auralux_users' },
  { name: 'music-service',        port: 3003, needsMongo: true,  db: 'auralux_music' },
  { name: 'streaming-service',    port: 3004, needsMongo: false },
  { name: 'playlist-service',     port: 3005, needsMongo: true,  db: 'auralux_playlists' },
  { name: 'history-service',      port: 3006, needsMongo: true,  db: 'auralux_history' },
  { name: 'recommendation-service', port: 3007, needsMongo: true, db: 'auralux_recommendations' },
  { name: 'analytics-service',    port: 3008, needsMongo: true,  db: 'auralux_analytics' },
  { name: 'notification-service', port: 3009, needsMongo: true,  db: 'auralux_notifications' },
  { name: 'realtime-service',     port: 3010, needsMongo: false },
];

// ─── Process Registry ─────────────────────────────────────────────────────────

const processes = [];

function killAll() {
  log('Launcher', 'Shutting down all processes...', C.yellow);
  for (const p of processes) {
    try { p.kill('SIGTERM'); } catch (_) {}
  }
}

process.on('SIGINT',  killAll);
process.on('SIGTERM', killAll);
process.on('exit',    killAll);

// ─── Spawn a service ──────────────────────────────────────────────────────────

function spawnService(name, scriptPath, env, color) {
  const cmd = 'node';
  const p = spawn(cmd, [scriptPath], {
    env: { ...process.env, ...env },
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  processes.push(p);

  p.stdout.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach(line =>
      log(name, line, color)
    );
  });
  p.stderr.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach(line =>
      log(name, line, C.red)
    );
  });

  p.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(name, `exited with code ${code}`, C.red);
    }
  });

  return p;
}

// ─── Start Next.js frontend ───────────────────────────────────────────────────

function startFrontend() {
  const color = nextColor();
  log('frontend', 'Starting Next.js dev server on http://localhost:3000', color);

  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  const p = spawn(npmCmd, ['run', 'dev'], {
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:3100',
    },
    cwd: path.join(ROOT, 'frontend'),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  processes.push(p);

  p.stdout.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach(line =>
      log('frontend', line, color)
    );
  });
  p.stderr.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      // Next.js writes normal output to stderr, don't tint it red
      log('frontend', line, color);
    });
  });

  p.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log('frontend', `exited with code ${code}`, C.red);
    }
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.bold}${C.green}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.green}║  Auralux X — No-Docker Dev Launcher          ║${C.reset}`);
  console.log(`${C.bold}${C.green}╚══════════════════════════════════════════════╝${C.reset}\n`);

  // ── Start MongoDB Memory Server ──────────────────────────────────────────
  let mongoUri = 'mongodb://127.0.0.1:27017'; // fallback if already running locally

  if (!FRONTEND_ONLY) {
    log('MongoDB', 'Starting in-memory MongoDB...', C.green);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { port: 27888 },
      });
      mongoUri = mongod.getUri();
      log('MongoDB', `In-memory MongoDB ready at ${mongoUri}`, C.green);

      // Keep process alive even if mongod emits close events
      process.on('exit', () => { mongod.stop().catch(() => {}); });
    } catch (err) {
      log('MongoDB', `Warning: failed to start in-memory MongoDB (${err.message}). Using localhost:27017 if available.`, C.yellow);
    }
  }

  // Strip trailing slash from mongoUri
  const mongoBase = mongoUri.replace(/\/$/, '');

  // ── Spawn Microservices ───────────────────────────────────────────────────
  if (!FRONTEND_ONLY) {
    log('Launcher', `Spawning ${SERVICES.length} microservices...`, C.cyan);

    for (const svc of SERVICES) {
      const scriptPath = path.join(ROOT, 'services', svc.name, 'dist', 'server.js');

      const env = {
        NODE_ENV:    'development',
        PORT:        String(svc.port),
        LOG_LEVEL:   'info',
        JWT_SECRET:  'dev-jwt-secret-change-in-prod',
        JWT_REFRESH_SECRET: 'dev-jwt-refresh-secret-change-in-prod',
        STREAM_SIGNING_SECRET: 'dev-stream-signing-secret',
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:3100',
        RATE_LIMIT_MAX: '10000',
        // Point every service at our in-memory MongoDB
        MONGO_URI:   mongoBase,
        MONGO_DB_NAME: svc.db || `auralux_${svc.name.replace(/-/g, '_')}`,
        // api-gateway downstream URLs
        AUTH_SERVICE_URL:           'http://localhost:3001',
        USER_SERVICE_URL:           'http://localhost:3002',
        MUSIC_SERVICE_URL:          'http://localhost:3003',
        STREAMING_SERVICE_URL:      'http://localhost:3004',
        PLAYLIST_SERVICE_URL:       'http://localhost:3005',
        HISTORY_SERVICE_URL:        'http://localhost:3006',
        RECOMMENDATION_SERVICE_URL: 'http://localhost:3007',
        ANALYTICS_SERVICE_URL:      'http://localhost:3008',
        NOTIFICATION_SERVICE_URL:   'http://localhost:3009',
        REALTIME_SERVICE_URL:       'http://localhost:3010',
      };

      const color = nextColor();
      log(svc.name, `Starting on port ${svc.port}`, color);
      spawnService(svc.name, scriptPath, env, color);

      // Small stagger to avoid port collisions during init
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // ── Start Frontend ────────────────────────────────────────────────────────
  if (!SERVICES_ONLY) {
    await new Promise(r => setTimeout(r, 1000)); // let services start first
    startFrontend();
  }

  // ── Print Summary ─────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 3000));
  console.log(`\n${C.bold}${C.green}─────────────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}  Auralux X is running!${C.reset}`);
  console.log(`${C.green}  Frontend:    ${C.bold}http://localhost:3000${C.reset}`);
  console.log(`${C.cyan}  API Gateway: ${C.bold}http://localhost:3100${C.reset}`);
  console.log(`${C.cyan}  Health:      ${C.bold}http://localhost:3100/health/live${C.reset}`);
  console.log(`${C.yellow}  Auth:        ${C.bold}http://localhost:3001${C.reset}`);
  console.log(`${C.yellow}  User:        ${C.bold}http://localhost:3002${C.reset}`);
  console.log(`${C.magenta}  Music:       ${C.bold}http://localhost:3003${C.reset}`);
  console.log(`${C.blue}  Streaming:   ${C.bold}http://localhost:3004${C.reset}`);
  console.log(`${C.bold}${C.green}─────────────────────────────────────────────────${C.reset}`);
  console.log(`  Press ${C.bold}Ctrl+C${C.reset} to stop all services.\n`);
}

main().catch(err => {
  console.error(`${C.red}[Launcher] Fatal error:${C.reset}`, err);
  killAll();
  process.exit(1);
});
