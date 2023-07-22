/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, webContents } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const LANGUAGE_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'languages')
  : path.join(__dirname, '../../languages');

const getLanguagePath = (...paths: string[]): string => {
  return path.join(LANGUAGE_PATH, ...paths);
};

ipcMain.on('ipc-example', async (event, arg) => {
  console.log(event, arg);
  if (arg == 'save-json') {
    saveJson(event, arg);
  }

  if (arg == 'read-json') {
    readjson(event, arg);
  }
});

const readjson = (event, arg) => {
  const jsonPath = getLanguagePath('test.json');
  fs.readFile(jsonPath, 'utf-8', (err, fileData) => {
    if (err) {
      console.error(err);
      return;
    }
    const jsonData = JSON.parse(fileData);
    console.log('数据', jsonData);
    mainWindow.webContents.send('read-json', jsonData);
  });
};

const saveJson = (event, arg) => {
  console.log('转换json文件');
  const stringPath = getLanguagePath('test.xml');
  const jsonPath = getLanguagePath('test.json');
  fs.readFile(stringPath, function (err, data) {
    parser.parseString(data, function (err, result) {
      if (err) {
        console.error(err);
        return;
      }
      const strings = result.resources.string;
      const jsonStrings = {};
      const jsonlist = [];
      for (let i = 0; i < strings.length; i++) {
        const key = strings[i].$.name;
        const value = strings[i]._;
        jsonlist.push({
          key,
          value,
        });
      }
      jsonStrings.list = jsonlist;
      fs.writeFile(
        jsonPath,
        JSON.stringify(jsonStrings, null, 2),
        function (err) {
          if (err) {
            console.error(err);
            return;
          }
          console.log(`Conversion done. JSON saved to ${jsonPath}`);
        }
      );
    });
  });
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
