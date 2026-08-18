import { app, ipcMain } from 'electron';
import { menubar } from 'menubar';
import path from 'path';
import { fileURLToPath } from 'url';
import { BdbConnectGateway } from '../server/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gateway = null;

app.on('ready', () => {
  const mb = menubar({
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
    },
    preloadWindow: true,
  });

  mb.on('ready', () => {
    console.log('Menubar app is ready.');
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
