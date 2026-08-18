import { app, ipcMain, Tray, nativeImage } from 'electron';
import { menubar } from 'menubar';
import path from 'path';
import { fileURLToPath } from 'url';
import { BdbConnectGateway } from '../server/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Hide the app completely from the macOS Dock (Pure Menubar App)
if (app.dock) {
  app.dock.hide();
}

let gateway = null;

app.on('ready', () => {
  const iconPath = path.join(__dirname, 'IconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  const tray = new Tray(icon);
  tray.setToolTip('BDB CONNECT');

  const mb = menubar({
    tray,
    index: `file://${path.join(__dirname, 'index.html')}`,
    browserWindow: {
      width: 320,
      height: 400,
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
    console.log('✅ BDB CONNECT Menubar App is running in macOS Status Bar.');
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
