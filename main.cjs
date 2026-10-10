const { app, BrowserWindow, Tray, Menu, ipcMain, screen, protocol, net, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Readable } = require('node:stream');
const ROOT = process.env.WHALE_HOME || (app.isPackaged ? path.resolve(path.dirname(process.execPath), '..') : __dirname);
const DATA = process.env.WHALE_TEST_DATA || path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });
app.setPath('userData', DATA);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
protocol.registerSchemesAsPrivileged([{ scheme: 'whale', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
let win, tray, timer, ignored = true;
const supported = /\.(mp3|wav|ogg|m4a|flac|aac)$/i;
function songs() {
  return fs.readdirSync(ROOT, { withFileTypes: true }).filter(x => x.isFile() && supported.test(x.name)).map(x => ({ name: x.name, url: 'whale://app/music/' + encodeURIComponent(x.name) })).sort((a,b) => a.name.localeCompare(b.name, 'zh-CN'));
}
function serveMusic(file, request) {
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size === 0) return new Response('Not found', { status: 404 });
  const range = request.headers.get('range');
  let start = 0, end = stat.size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + stat.size } });
    if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (start > end || start >= stat.size) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + stat.size } });
  }
  const types = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac' };
  const headers = { 'Content-Type': types[path.extname(file).toLowerCase()], 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' };
  if (range) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
  return new Response(request.method === 'HEAD' ? null : Readable.toWeb(fs.createReadStream(file, { start, end })), { status: range ? 206 : 200, headers });
}
function send(action) { if (win && !win.isDestroyed()) win.webContents.send('action', action); }
function visible() { win.showInactive(); }
function settings() { visible(); win.focus(); send('settings'); }
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', settings);
  app.whenReady().then(() => {
    protocol.handle('whale', request => {
      try {
        const u = new URL(request.url);
        if (u.hostname !== 'app') return new Response('Forbidden', { status: 403 });
        let file;
        if (u.pathname.startsWith('/music/')) {
          const name = decodeURIComponent(u.pathname.slice(7));
          if (path.basename(name) !== name || !supported.test(name)) return new Response('Forbidden', { status: 403 });
          file = path.join(ROOT, name);
          return serveMusic(file, request);
        } else if (u.pathname === '/api/dsh-whale-musume/assets') {
          const base = path.join(__dirname, 'upstream', 'assets');
          file = path.resolve(base, u.searchParams.get('f') || '');
          if (!file.startsWith(base + path.sep)) return new Response('Forbidden', { status: 403 });
        } else {
          const base = path.join(__dirname, 'public');
          file = path.resolve(base, '.' + decodeURIComponent(u.pathname));
          if (!file.startsWith(base + path.sep)) return new Response('Forbidden', { status: 403 });
        }
        return net.fetch(pathToFileURL(file).toString(), { headers: request.headers });
      } catch { return new Response('Not found', { status: 404 }); }
    });
    win = new BrowserWindow({ ...screen.getPrimaryDisplay().workArea, title: '鲸鱼娘 · 桌面大肥鱼', transparent: true, backgroundColor: '#00000000', frame: false, thickFrame: false, hasShadow: false, skipTaskbar: true, alwaysOnTop: true, resizable: false, show: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
    win.setIgnoreMouseEvents(true, { forward: true });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    win.webContents.on('console-message', details => {
      if (details.level >= 2) fs.appendFileSync(path.join(DATA, 'desktop.log'), details.message + '\n');
    });
    ipcMain.handle('songs', () => songs());
    ipcMain.on('interactive', (_e, interactive) => {
      const next = !Boolean(interactive);
      if (next !== ignored) { ignored = next; win.setIgnoreMouseEvents(next, { forward: true }); }
    });
    ipcMain.on('quit', () => app.quit());
    ipcMain.on('focus', () => win.focus());
    ipcMain.on('hide', () => { send('pause'); win.hide(); });
    const icon = nativeImage.createFromPath(path.join(__dirname, 'public/icon.png')).resize({width:32,height:32});
    tray = new Tray(icon);
    tray.setToolTip('桌面大肥鱼 · 鲸鱼娘');
    function trayMenu() {
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: '显示鲸鱼娘', click: () => { visible(); send('show'); } },
        { label: '音乐与养成设置', click: settings },
        { label: '暂停音乐', click: () => send('pause') },
        { label: '回到屏幕右下角', click: () => { visible(); send('reset'); } },
        { label: '隐藏鲸鱼娘', click: () => { send('pause'); win.hide(); } },
        { label: '移动到显示器', submenu: screen.getAllDisplays().map((d,i) => ({label: '显示器 ' + (i + 1), click: () => {win.setBounds(d.workArea); send('reset');}})) },
        { type: 'separator' }, { label: '退出桌宠', click: () => app.quit() }
      ]));
    }
    trayMenu(); tray.on('double-click', settings);
    screen.on('display-metrics-changed', () => { win.setBounds(screen.getDisplayMatching(win.getBounds()).workArea); trayMenu(); });
    screen.on('display-removed', () => { win.setBounds(screen.getPrimaryDisplay().workArea); send('reset'); trayMenu(); });
    screen.on('display-added', trayMenu);
    win.once('ready-to-show', visible);
    win.loadURL('whale://app/index.html');
    timer = setInterval(() => {
      if (!win || win.isDestroyed() || !win.isVisible()) return;
      const p = screen.getCursorScreenPoint(), b = win.getBounds();
      win.webContents.send('cursor', { x: p.x - b.x, y: p.y - b.y });
    }, 60);
  });
  app.on('before-quit', () => clearInterval(timer));
  app.on('window-all-closed', () => app.quit());
}
