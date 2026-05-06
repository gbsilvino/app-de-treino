require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Intercepta erros graves no processo principal para que não falhem silenciosamente
process.on('uncaughtException', (error) => {
  console.error('Erro fatal no processo principal:', error);
  dialog.showErrorBox('Erro Fatal (Processo Principal)', `Ocorreu um crash no sistema:\n\n${error.message}\n\nVerifique os logs do console.`);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 520,
    height: 620,
    resizable: true,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      sandbox: false
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.maximize();

  ipcMain.handle('selecionar-pasta', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
