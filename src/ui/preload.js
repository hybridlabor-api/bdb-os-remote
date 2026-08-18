const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    const validChannels = ['toggle-server', 'open-web-ui', 'close-window', 'quit-app', 'open-update-link'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ['server-status', 'update-available'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    }
  }
});
