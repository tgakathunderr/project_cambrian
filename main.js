const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

// Configure environments
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 8000;

function startBackend() {
  if (isDev) {
    console.log("Launching backend in development mode...");
    // Run python FastAPI backend directly
    backendProcess = spawn('python', ['-m', 'uvicorn', 'backend.main:app', '--port', PORT.toString()], {
      cwd: __dirname,
      shell: true,
      stdio: 'inherit'
    });
  } else {
    console.log("Launching frozen backend in production mode...");
    const binaryPath = path.join(
      process.resourcesPath,
      'extraResources',
      'cambrian_backend',
      process.platform === 'win32' ? 'cambrian_backend.exe' : 'cambrian_backend'
    );
    backendProcess = spawn(binaryPath, [], {
      cwd: path.dirname(binaryPath),
      stdio: 'inherit'
    });
  }

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Cambrian | Digital Terrarium",
    backgroundColor: "#00170f",
    icon: path.join(__dirname, 'frontend/dist/favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Render borderless styling layout
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // Development mode points to Vite HMR dev server
    mainWindow.loadURL(`http://localhost:5173`);
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode loads compiled static HTML files from local disk
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkBackendReady(callback) {
  const req = http.request({
    host: '127.0.0.1',
    port: PORT,
    path: '/api/saves',
    method: 'GET',
    timeout: 1000
  }, (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      setTimeout(() => checkBackendReady(callback), 250);
    }
  });

  req.on('error', () => {
    setTimeout(() => checkBackendReady(callback), 250);
  });

  req.end();
}

app.on('ready', () => {
  startBackend();
  // Wait for the backend to be fully bound before creating window
  checkBackendReady(createWindow);
});

app.on('window-all-closed', () => {
  // Gracefully kill background python process on quit to prevent orphaned tasks
  if (backendProcess) {
    console.log("Terminating backend process...");
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    } else {
      backendProcess.kill('SIGTERM');
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
