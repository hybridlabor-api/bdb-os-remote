import { app, ipcMain, shell, Tray, nativeImage } from 'electron';
import { menubar } from 'menubar';
import path from 'path';
import { fileURLToPath } from 'url';
import { BdbConnectGateway } from '../server/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

// 1. On macOS, hide the app completely from the Dock
if (isMac && app.dock) {
  app.dock.hide();
}

let gateway = null;

app.on('ready', () => {
  // 2. Cross-platform Icon Selection
  let iconPath;
  let icon;

  if (isMac) {
    iconPath = path.join(__dirname, 'IconTemplate.png');
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } else {
    // Windows / Linux System Tray
    iconPath = path.join(__dirname, 'icon.png');
    icon = nativeImage.createFromPath(iconPath);
  }

  const tray = new Tray(icon);
  tray.setToolTip('BDB CONNECT');

  // 3. Menubar Popover Configuration
  const mb = menubar({
    tray,
    index: `file://${path.join(__dirname, 'index.html')}`,
    browserWindow: {
      width: 320,
      height: 440,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true
    },
    preloadWindow: true,
  });

  mb.on('ready', () => {
    console.log(`✅ BDB CONNECT Menubar App is running on ${process.platform}.`);
  });

  ipcMain.on('open-web-ui', (event, targetUrl) => {
    const url = targetUrl || 'http://127.0.0.1:8000';
    shell.openExternal(url);
  });

  ipcMain.on('toggle-server', async (event, state) => {
    if (state && !gateway) {
      gateway = new BdbConnectGateway({ port: 8000 });
      try {
        const info = await gateway.start();
        event.reply('server-status', { status: 'running', info });
      } catch (err) {
        event.reply('server-status', { status: 'error', error: err.message });
      }
    } else if (!state && gateway) {
      gateway.stop();
      gateway = null;
      event.reply('server-status', { status: 'stopped' });
    }
  });
});
