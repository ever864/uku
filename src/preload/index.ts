import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);

    contextBridge.exposeInMainWorld("electron", {
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => {
          ipcRenderer.on(channel, (_event, ...args) => func(...args));
        },
        removeAllListeners: (channel: string) => {
          ipcRenderer.removeAllListeners(channel);
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
