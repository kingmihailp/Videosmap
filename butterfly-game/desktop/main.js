// Desktop shell: opens the single-file game in its own window (no browser, no menu bar).
// Also the Steam build: Steamworks (overlay, achievements) when the steam client is running, the save kept in a real file (Steam Auto-Cloud).
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path'), fs = require('fs');

const gameFile = app.isPackaged ? path.join(process.resourcesPath, 'game.html') : path.join(__dirname, '..', 'Flora0world_Butterflies.html');
const APP_ID = (() => { try { return parseInt(fs.readFileSync(path.join(app.isPackaged ? process.resourcesPath : __dirname, 'steam_appid.txt'), 'utf8'), 10) || 0; } catch (e) { return 0; } })();

// Steam: optional, the game also runs without it (itch.io, a plain exe, no client running)
let steam = null;
if (APP_ID) {
  try { steam = require('steamworks.js').init(APP_ID); }
  catch (e) { console.warn('Steam is not available:', e && e.message); steam = null; }
  app.commandLine.appendSwitch('in-process-gpu'); app.commandLine.appendSwitch('disable-direct-composition');   // lets the Steam overlay hook the window
}
ipcMain.on('steam:available', e => { e.returnValue = !!steam; });
ipcMain.on('steam:unlock', (e, id) => { try { if (steam && /^[A-Z0-9_]{1,64}$/.test(id)) steam.achievement.activate(id); } catch (err) {} });

// the save: <user data>/saves/save.json (Steam Auto-Cloud syncs this folder); written atomically with a backup of the previous one
const saveDir = path.join(app.getPath('userData'), 'saves'), saveFile = path.join(saveDir, 'save.json');
ipcMain.on('save:read', e => { let s = ''; try { s = fs.readFileSync(saveFile, 'utf8'); JSON.parse(s); } catch (err) { try { s = fs.readFileSync(saveFile + '.bak', 'utf8'); JSON.parse(s); } catch (e2) { s = ''; } } e.returnValue = s; });
ipcMain.on('save:write', (e, s) => {
  if (typeof s !== 'string' || s.length > 64 * 1024 * 1024) return;
  try { fs.mkdirSync(saveDir, { recursive: true }); if (fs.existsSync(saveFile)) fs.copyFileSync(saveFile, saveFile + '.bak'); fs.writeFileSync(saveFile + '.tmp', s); fs.renameSync(saveFile + '.tmp', saveFile); } catch (err) { console.warn('save failed', err && err.message); }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 800, minHeight: 500, backgroundColor: '#0b1020', title: 'Flora0world: Butterflies',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false, preload: path.join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.loadFile(gameFile);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('before-input-event', (e, i) => {      // F11 / Alt+Enter = fullscreen
    if (i.type === 'keyDown' && (i.key === 'F11' || (i.key === 'Enter' && i.alt))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
