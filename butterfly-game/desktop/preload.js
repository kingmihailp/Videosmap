// Bridge between the game page and the main process: save file + Steam achievements (nothing else is exposed)
const { contextBridge, ipcRenderer } = require('electron');
const steam = ipcRenderer.sendSync('steam:available');
contextBridge.exposeInMainWorld('F0WNative', {
  readSave: () => ipcRenderer.sendSync('save:read'),
  writeSave: s => ipcRenderer.send('save:write', String(s)),
  steam: steam ? { unlock: id => ipcRenderer.send('steam:unlock', String(id)) } : null,
});
