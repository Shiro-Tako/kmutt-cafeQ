import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createConnection } from 'node:net';
import mysql from '../backend/node_modules/mysql2/promise.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = join(root, '.local');
const data = join(local, 'mysql');
const executable = process.env.MYSQLD_PATH || 'C:/Program Files/MySQL/MySQL Server 26.7/bin/mysqld.exe';
const useTailscale = process.argv.includes('--tailscale');
const online = process.argv.includes('--online') || useTailscale;
const tunnelPath = join(local, 'cloudflared.exe');
const tailscalePath = process.env.TAILSCALE_PATH || 'C:/Program Files/Tailscale/tailscale.exe';
let database;
let app;
let tunnel;
let stopping = false;
let config;
let connection;
let controlTimer;

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}

async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(controlTimer);
  tunnel?.kill();
  app?.kill();
  try {
    if (database) {
      const admin = await mysql.createConnection({ host: '127.0.0.1', port: config.dbPort, user: 'root', password: config.rootPassword });
      await admin.query('SHUTDOWN');
      await admin.end();
    }
  } catch { database?.kill(); }
  await connection?.end().catch(() => {});
  process.exit(process.exitCode ?? 0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

try {
  if (!existsSync(executable)) throw new Error('Set MYSQLD_PATH to the installed mysqld.exe.');
  if (!existsSync(join(root, 'frontend/dist/index.html'))) throw new Error('Build the frontend first.');
  if (useTailscale) {
    if (!existsSync(tailscalePath)) throw new Error('Install Tailscale and log in before using --tailscale.');
    const status = JSON.parse(execFileSync(tailscalePath, ['status', '--json'], { windowsHide: true, encoding: 'utf8' }));
    if (status.BackendState !== 'Running') throw new Error('Log in to Tailscale first, then run this command again.');
    console.log('Tailscale device: ' + status.Self?.DNSName);
  } else if (online && !existsSync(tunnelPath)) {
    throw new Error('Download cloudflared into .local/cloudflared.exe first. See docs/laptop-server.md.');
  }
  await mkdir(local, { recursive: true });
  const stopFile = join(local, 'stop-server');
  await rm(stopFile, { force: true });
  const configFile = join(local, 'server.json');
  if (existsSync(configFile)) config = JSON.parse(await readFile(configFile, 'utf8'));
  else {
    config = {
      dbPort: 3307, appPort: 3000,
      rootPassword: randomBytes(24).toString('hex'),
      dbPassword: randomBytes(24).toString('hex'),
      accountPassword: randomBytes(12).toString('base64url'),
    };
    await writeFile(configFile, JSON.stringify(config, null, 2));
  }
  if (await portInUse(config.dbPort) || await portInUse(config.appPort)) {
    throw new Error('A server already uses the CafeQ ports. Stop the existing server before starting another.');
  }
  controlTimer = setInterval(() => { if (existsSync(stopFile)) stop(); }, 500);
  const fresh = !existsSync(join(data, 'mysql'));
  const initFile = join(local, 'initialize.sql');
  if (fresh) {
    await mkdir(data, { recursive: true });
    execFileSync(executable, ['--no-defaults', '--initialize-insecure', '--datadir=' + data], { windowsHide: true, stdio: 'inherit' });
    await writeFile(initFile, [
      "ALTER USER 'root'@'localhost' IDENTIFIED BY '" + config.rootPassword + "';",
      'CREATE DATABASE IF NOT EXISTS kmutt_cafeq CHARACTER SET utf8mb4;',
      "CREATE USER IF NOT EXISTS 'cafeq'@'127.0.0.1' IDENTIFIED BY '" + config.dbPassword + "';",
      "GRANT ALL PRIVILEGES ON kmutt_cafeq.* TO 'cafeq'@'127.0.0.1';",
    ].join('\n'));
  }
  const log = createWriteStream(join(local, 'mysql.log'), { flags: 'a' });
  database = spawn(executable, ['--no-defaults', '--datadir=' + data, '--bind-address=127.0.0.1', '--port=' + config.dbPort, '--mysqlx=0', ...(fresh ? ['--init-file=' + initFile] : [])], { windowsHide: true });
  database.stdout.pipe(log);
  database.stderr.pipe(log);
  database.on('error', (error) => { console.error(error.message); stop(); });
  database.on('exit', () => { if (!stopping) stop(); });
  for (let attempt = 0; attempt < 90; attempt++) {
    if (database.exitCode !== null) throw new Error('MySQL stopped. See .local/mysql.log.');
    try {
      connection = await mysql.createConnection({ host: '127.0.0.1', port: config.dbPort, user: 'cafeq', password: config.dbPassword, database: 'kmutt_cafeq' });
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!connection) throw new Error('Could not connect to local MySQL. See .local/mysql.log.');
  await rm(initFile, { force: true });
  for (const name of ['schema.sql', 'presentation.sql']) {
    const schema = await readFile(join(root, 'database', name), 'utf8');
    for (const statement of schema.split(';').map((entry) => entry.trim()).filter(Boolean)) await connection.query(statement);
  }
  await connection.end();
  connection = null;
  const env = {
    ...process.env, DATA_STORE: 'mysql', CATALOG_SOURCE: 'demo',
    DB_HOST: '127.0.0.1', DB_PORT: String(config.dbPort),
    DB_USER: 'cafeq', DB_PASSWORD: config.dbPassword, DB_NAME: 'kmutt_cafeq',
    PORT: String(config.appPort), DEMO_SEED_PASSWORD: config.accountPassword, PUBLIC_HTTPS: String(online),
  };
  app = spawn(process.execPath, ['src/server.js'], { cwd: join(root, 'backend'), env, stdio: 'inherit', windowsHide: true });
  app.on('error', (error) => { console.error(error.message); stop(); });
  app.on('exit', () => { if (!stopping) stop(); });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:' + config.appPort + '/api/cafes');
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('The API did not become ready.');
  console.log('CafeQ runs at http://127.0.0.1:' + config.appPort);
  console.log('Account credentials and MySQL Workbench connection details are in .local/server.json.');
  console.log('Press Ctrl+C here to stop CafeQ and its MySQL process.');
  if (online) {
    const command = useTailscale ? tailscalePath : tunnelPath;
    const args = useTailscale
      ? ['funnel', 'http://127.0.0.1:' + config.appPort]
      : ['tunnel', '--url', 'http://127.0.0.1:' + config.appPort, '--no-autoupdate'];
    tunnel = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    tunnel.on('error', (error) => { console.error(error.message); stop(); });
    tunnel.on('exit', () => { if (!stopping) stop(); });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  await stop();
}
