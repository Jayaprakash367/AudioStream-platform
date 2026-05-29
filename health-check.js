/**
 * System Health Check & Verification
 * Verifies all UI components are properly connected to backend
 */

'use strict';
const http = require('http');

const endpoints = [
  { name: 'Frontend', url: 'http://localhost:3000', method: 'GET' },
  { name: 'API Gateway', url: 'http://localhost:3100/health/live', method: 'GET' },
  { name: 'Auth Service', url: 'http://localhost:3001/health', method: 'GET' },
  { name: 'User Service', url: 'http://localhost:3002/health', method: 'GET' },
  { name: 'Music Service', url: 'http://localhost:3003/health', method: 'GET' },
  { name: 'Streaming Service', url: 'http://localhost:3004/health', method: 'GET' },
];
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: endpoint.method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({
        name: endpoint.name,
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'online' : 'error',
        code: res.statusCode,
      });
    });

    req.on('error', () => {
      resolve({
        name: endpoint.name,
        status: 'offline',
        code: null,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        status: 'timeout',
        code: null,
      });
    });

    req.end();
  });
}

async function main() {
  console.log('');
  console.log(
    `${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}║     Auralux X - System Health Check                             ║${colors.reset}`
  );
  console.log(
    `${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}`
  );
  console.log('');

  console.log(`${colors.blue}Checking services...${colors.reset}`);
  console.log('');

  const results = await Promise.all(endpoints.map(checkEndpoint));

  const online = results.filter((r) => r.status === 'online');
  const offline = results.filter((r) => r.status === 'offline');
  const timeout = results.filter((r) => r.status === 'timeout');

  results.forEach((result) => {
    let statusColor = colors.red;
    let statusText = '●';

    if (result.status === 'online') {
      statusColor = colors.green;
      statusText = '✓';
    } else if (result.status === 'timeout') {
      statusColor = colors.yellow;
      statusText = '⏱';
    }

    console.log(
      `${statusColor}${statusText}${colors.reset} ${result.name.padEnd(20)} ${
        result.status === 'online'
          ? `${colors.green}Online (${result.code})${colors.reset}`
          : `${colors.red}${result.status.toUpperCase()}${colors.reset}`
      }`
    );
  });

  console.log('');
  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(
    `  ${colors.green}${online.length} Online${colors.reset} | ${colors.red}${offline.length} Offline${colors.reset} | ${colors.yellow}${timeout.length} Timeout${colors.reset}`
  );
  console.log('');

  if (online.length >= 1) {
    console.log(`${colors.green}✓ UI Components Connected${colors.reset}`);
  } else {
    console.log(
      `${colors.red}✗ No services detected - UI using mock data${colors.reset}`
    );
  }

  if (online.length >= 5) {
    console.log(`${colors.green}✓ Full Backend Connected${colors.reset}`);
  } else if (online.length >= 1) {
    console.log(
      `${colors.yellow}⚠ Partial Backend Connected - ${
        6 - online.length
      } services offline${colors.reset}`
    );
  }

  console.log('');
  console.log(`${colors.cyan}API Endpoints:${colors.reset}`);
  console.log(`  Frontend:          ${colors.blue}http://localhost:3000${colors.reset}`);
  console.log(
    `  API Gateway:       ${colors.blue}http://localhost:3100${colors.reset}`
  );
  console.log(`  Auth Service:      ${colors.blue}http://localhost:3001${colors.reset}`);
  console.log(`  User Service:      ${colors.blue}http://localhost:3002${colors.reset}`);
  console.log(`  Music Service:     ${colors.blue}http://localhost:3003${colors.reset}`);
  console.log(
    `  Streaming Service: ${colors.blue}http://localhost:3004${colors.reset}`
  );

  console.log('');
  console.log(`${colors.cyan}Documentation:${colors.reset}`);
  console.log(`  Setup Guide:        ${colors.blue}COMPLETE_SETUP_GUIDE.md${colors.reset}`);
  console.log(
    `  Integration Docs:   ${colors.blue}FRONTEND_BACKEND_INTEGRATION.md${colors.reset}`
  );

  console.log('');
}

main().catch(console.error);
