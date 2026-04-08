import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import * as net from "node:net";
import { registerIpcHandlers } from "./ipc/modelHandlers";

const isDev = !app.isPackaged;
const appHtmlPath = path.join(__dirname, "../dist/index.html");
const devHost = "127.0.0.1";
const devPort = 5173;

const canConnectDevServer = () =>
  new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: devHost, port: devPort });
    socket.setTimeout(200);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });

async function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#F3F5F8",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && (await canConnectDevServer())) {
    void win.loadURL(`http://${devHost}:${devPort}`);
    return;
  }
  void win.loadFile(appHtmlPath);
}

app.whenReady().then(() => {
  registerIpcHandlers();
  void createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
