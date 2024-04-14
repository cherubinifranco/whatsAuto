const { ipcRenderer } = window.require("electron");

ipcRenderer.on("log", (event, data) => {
  console.log(data)
})

ipcRenderer.on("handleSession", (event, state) => {
  sessionStorage.setItem("session", state);
});

ipcRenderer.on("handleQR", (event, QR) => {
  sessionStorage.setItem("qr", QR);
});
