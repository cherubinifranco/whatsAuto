const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { fetchDataFromXLSX, fetchSampleDataFromXLSX } = require("./fetchData");
const { parseEntries, parseTestMsje } = require("./messageSender");
const QRCode = require("qrcode");
const { MessageMedia } = require("whatsapp-web.js");

const { Client, LocalAuth } = require("whatsapp-web.js");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 630,
    minHeight: 630,
    minWidth: 800,
    frame: false,
    webPreferences: {
      // preload: path.join(__dirname, "/preload.js"),
      devTools: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const windowURL = true
    ? `file://${path.join(__dirname, "/build/index.html")}`
    : "http://localhost:3000/";

  win.loadURL(windowURL);

  // Open the DevTools.

  ipcMain.on("closeApp", () => {
    win.close();
  });

  const wwebVersion = "2.2407.3";
  const client = new Client({
    // your authstrategy here
    authStrategy: new LocalAuth(),
    puppeteer: {
      // puppeteer args here
    },
    webVersionCache: {
      type: "remote",
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
  });

  client.initialize();

  client.on("ready", () => {
    win.webContents.send("handleSession", "active");
  });

  client.on("auth_failure", () => {
    win.webContents.send("handleSession", "inactive");
    client.initialize();
  });

  client.on("qr", async (qr) => {
    const QR = await QRCode.toString(qr, { type: "utf8", width: 400 });
    win.webContents.send("handleQR", QR);
    win.webContents.send("handleSession", "inactive");
  });

  ipcMain.handle("getStatus", async () => {
    try {
      const state = await client.getState();
      return state;
    } catch (e) {
      client.initialize();
      win.webContents.send("handleSession", "inactive");
      return;
    }
  });

  ipcMain.handle("sendMessages", async (event, obj) => {
    const entries = await parseEntries(obj); // [{cellID, parsedNumber, parsedMsje}, {}]
    const errors = [];
    const sended = [];

    for (const el of entries) {
      try {
        if (obj.files == "") {
          const sendMessageData = await client.sendMessage(el.number, el.msje);
          sended.push(sendMessageData);
        } else {
          const media = MessageMedia.fromFilePath(obj.files);
          const sendMessageData = await client.sendMessage(el.number, media, {
            caption: el.msje,
          });
          sended.push(sendMessageData);
        }
      } catch (e) {
        errors.push({
          cellID: el.cellID,
          number: el.nonParsedNumber,
          error: "Problema con el envio",
        });
      }
    }

    return [errors, sended]; // [[errors], number]
  });

  ipcMain.handle("sendTestMsje", async (event, data) => {
    const info = await client.info;
    const parsedNumber = info.me._serialized;
    const parsedMsje = await parseTestMsje(data);

    try {
      if (data.files == "") {
        const sendMessageData = await client.sendMessage(
          parsedNumber,
          parsedMsje
        );
        return "Se envio con exito el mensaje";
      } else {
        const media = MessageMedia.fromFilePath(data.files);
        const sendMessageData = await client.sendMessage(parsedNumber, media, {
          caption: parsedMsje,
        });
        return "Se envio con exito el mensaje";
      }
    } catch (e) {
      console.log(e);
      return "Error al enviar el mensaje de prueba";
    }
  });

  ipcMain.on("handleLogout", async () => {
    await client.logout();
    await win.webContents.send("handleSession", "inactive");
    await client.initialize();
    return;
  });

  ipcMain.on("maxResApp", () => {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  });
  ipcMain.on("minimizeApp", () => {
    win.minimize();
  });

  ipcMain.handle("selectDirectory", async function () {
    let dir = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });

    return dir.filePaths[0];
  });

  ipcMain.handle("selectFile", async function () {
    let file = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
    });

    return file.filePaths[0];
  });

  ipcMain.handle("getSampleData", async (event, xlsxFile) => {
    const sampleData = await fetchSampleDataFromXLSX(xlsxFile);
    return sampleData;
  });

  ipcMain.handle("fetchAllData", async (event, xlsxFile) => {
    const data = await fetchDataFromXLSX(xlsxFile);
    return data;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
