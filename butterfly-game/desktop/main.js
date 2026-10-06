// Desktop shell: opens the single-file game in its own window (no browser, no menu bar).
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const gameFile = app.isPackaged ? path.join(process.resourcesPath, 'game.html') : path.join(__dirname, '..', 'Flora0world_Butterflies.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 800, minHeight: 500, backgroundColor: '#0b1020', title: 'Flora0world: Butterflies',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.loadFile(gameFile);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('before-input-event', (e, i) => {      // F11 = fullscreen
    if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
