import { app, ipcMain, shell, Tray, nativeImage, Menu, Notification } from 'electron';
import https from 'https';
import fs from 'fs';
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


function isNewerVersion(latest, current) {
  return latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) > 0;
}

function handleUpdateNotification(version) {
  const statePath = path.join(app.getPath('userData'), 'update-state.json');
  let state = {};
  if (fs.existsSync(statePath)) {
    try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch(e) {}
  }
  
  if (state.version !== version) {
    state = { version: version, discoveredAt: Date.now(), notified: false };
    fs.writeFileSync(statePath, JSON.stringify(state));
  } else if (!state.notified) {
    const daysDiff = (Date.now() - state.discoveredAt) / (1000 * 60 * 60 * 24);
    if (daysDiff >= 5) {
      const notification = new Notification({
        title: 'BDB CONNECT Update',
        body: `Version ${version} ist verfügbar. Klicke hier zum Download.`
      });
      notification.on('click', () => {
        shell.openExternal('https://github.com/hybridlabor-api/bdb-os-remote/releases/latest');
      });
      notification.show();
      state.notified = true;
      fs.writeFileSync(statePath, JSON.stringify(state));
    }
  }
}

function checkForUpdates(mb) {
  const currentVersion = app.getVersion();
  https.get('https://registry.npmjs.org/@hybridlabor-api/bdb-os-remote/latest', {
    headers: { 'User-Agent': 'BDB-CONNECT-APP' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const latestVersion = json.version;
        if (latestVersion && latestVersion !== currentVersion && isNewerVersion(latestVersion, currentVersion)) {
          if (mb && mb.window) mb.window.webContents.send('update-available', latestVersion);
          handleUpdateNotification(latestVersion);
        }
      } catch(e) {
        console.error('Update check parse error', e);
      }
    });
  }).on('error', (e) => {
    console.error('Update check request error', e);
  });
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
      height: 460,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      alwaysOnTop: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      vibrancy: isMac ? 'under-window' : undefined,
      visualEffectState: isMac ? 'active' : undefined,
      hasShadow: false,
      resizable: false,
      skipTaskbar: true
    },
    preloadWindow: true,
  });

  // 4. Right-Click Context Menu for Tray Icon
  const createContextMenu = () => {
    return Menu.buildFromTemplate([
      { label: 'BDB CONNECT (v2.0)', enabled: false },
      { label: `Status: ${gateway ? 'Running (Port 8000)' : 'Idle'}`, enabled: false },
      { type: 'separator' },
      {
        label: 'Open Web UI',
        click: () => shell.openExternal('http://127.0.0.1:8000')
      },
      {
        label: 'Toggle Popover',
        click: () => {
          if (mb.window && mb.window.isVisible()) {
            mb.hideWindow();
          } else {
            mb.showWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit BDB CONNECT',
        accelerator: isMac ? 'Command+Q' : 'Alt+F4',
        click: () => {
          if (gateway) {
            gateway.stop();
          }
          app.quit();
        }
      }
    ]);
  };

  tray.on('right-click', () => {
    tray.popUpContextMenu(createContextMenu());
  });

  // 5. Automatically hide popover when clicking away / losing focus
  mb.on('after-create-window', () => {
    mb.window.on('blur', () => {
      mb.hideWindow();
    });
  });

  mb.on('ready', () => {
    console.log(`✅ BDB CONNECT Menubar App is running on ${process.platform}.`);
    checkForUpdates(mb);
    setInterval(() => checkForUpdates(mb), 12 * 60 * 60 * 1000);
  });

  ipcMain.on('open-update-link', () => {
    shell.openExternal('https://github.com/hybridlabor-api/bdb-os-remote/releases/latest');
  });

  ipcMain.on('close-window', () => {
    mb.hideWindow();
  });

  ipcMain.on('quit-app', () => {
    if (gateway) {
      gateway.stop();
    }
    app.quit();
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
