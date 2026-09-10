// electron/main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 __dirname 在 ES Module 中不可用的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    win.loadURL('http://192.168.1.85:3001'); // 改成你实际的端口
  } else {
    // win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    win.loadURL('http://192.168.1.85:3001'); // 改成你实际的端口
  }
}

app.whenReady().then(createWindow);