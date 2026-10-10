const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  songs: () => ipcRenderer.invoke('songs'),
  interactive: value => ipcRenderer.send('interactive', Boolean(value)),
  focus: () => ipcRenderer.send('focus'),
  quit: () => ipcRenderer.send('quit'),
  hide: () => ipcRenderer.send('hide'),
  onCursor: cb => ipcRenderer.on('cursor', (_event, point) => cb(point)),
  onAction: cb => ipcRenderer.on('action', (_event, action) => cb(action))
});
