import {
  app,
  shell,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  ipcMain,
  dialog,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

let recentFiles: string[] = [];
let mainWindow: BrowserWindow | null = null;

function addRecentFile(filePath: string): void {
  const index = recentFiles.indexOf(filePath);

  if (index !== -1) {
    recentFiles.splice(index, 1);
  }

  recentFiles.unshift(filePath);

  if (recentFiles.length > 10) {
    recentFiles = recentFiles.slice(0, 10);
  }

  rebuildMenu();
}

function clearRecentFiles(): void {
  recentFiles = [];
  app.clearRecentDocuments();
  rebuildMenu();
}

function createRecentFilesSubmenu(): MenuItemConstructorOptions[] {
  if (recentFiles.length === 0) {
    return [
      {
        label: "No hay archivos recientes",
        enabled: false,
      },
    ];
  }

  const recentItems: MenuItemConstructorOptions[] = recentFiles.map(
    (filePath) => ({
      label: filePath,
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send("menu-open", filePath);
        }
      },
    }),
  );

  recentItems.push(
    { type: "separator" },
    {
      label: "Limpiar recientes",
      click: clearRecentFiles,
    },
  );

  return recentItems;
}

function createMenuTemplate(): MenuItemConstructorOptions[] {
  return [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Abrir",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;

            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                { name: "Archivos PDF", extensions: ["pdf"] },
                { name: "Todos los archivos", extensions: ["*"] },
              ],
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];

              app.addRecentDocument(filePath);
              addRecentFile(filePath);
              mainWindow.webContents.send("menu-open", filePath);
            }
          },
        },
        {
          label: "Abrir recientes",
          submenu: createRecentFilesSubmenu(),
        },
        { type: "separator" },
        {
          label: "Salir",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        {
          role: "reload",
        },
        {
          role: "toggleDevTools",
        },
        {
          type: "separator",
        },
        {
          role: "togglefullscreen",
        },
      ],
    },
  ];
}

function rebuildMenu(): void {
  const menuTemplate = createMenuTemplate();
  const appMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(appMenu);
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  rebuildMenu();

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
