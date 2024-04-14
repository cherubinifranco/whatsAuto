const { ipcRenderer } = window.require('electron');



export async function checkData(obj){ //obj = {xlsxFile, message}
  let skip = false
  if(obj.msje == "") skip = true;
  if(obj.xlsxFile == "" || obj.xlsxFile == undefined) skip = true;
  return skip
}
export async function sendMessages(obj){ //obj = {xlsxFile, message, files}
  const data = await ipcRenderer.invoke("sendMessages", obj); // [errors, sended]
  return data
}

export async function checkStatus(){
  const status = await ipcRenderer.invoke("getStatus")
  console.log(status)
  return status;
}

export async function logout(){
  ipcRenderer.send("handleLogout");
}

export async function sendTestMsje(){
  const msjeToSend = localStorage.getItem("msjeToSend") ?? "No se establecio un mensaje para mandar";
  const files = localStorage.getItem("files") ?? ""
  const xlsxFile = localStorage.getItem("xlsxFile") ?? ""
  const obj = {
    msje: msjeToSend,
    files,
    xlsxFile
  }
  const skip = await checkData(obj)
  if(skip){
    return "Hubo un error al mandar el mensaje. Verifica haber seleccionado un XLSX y haber escrito un mensaje"
  }
  return await ipcRenderer.invoke("sendTestMsje", obj); 
}


export async function loadTemplateDataFromXlsx(xlsxFile) {
  if (xlsxFile == "" || xlsxFile == null || xlsxFile == undefined) {
    return false;
  }
  const sampleData = await ipcRenderer.invoke("getSampleData", xlsxFile);
  return sampleData;
}

export function arrayToObj(array) {
  const resObj = {};
  array.forEach((el) => {
    resObj[el[0]] = el[1];
  });

  return resObj;
}
export function objToArrayOfEntries(obj) {
  const resArray = Object.keys(obj);
  return resArray;
}

export function applyTemplate(message, obj) {
  const newObj = {
    ...obj,
  };
  for (const key in newObj) {
    const lookup = new RegExp(`{${key}}`, "g");
    const value = newObj[key];
    if (lookup.test(message)) {
      message = message.replace(lookup, value);
    }
  }
  return message;
}

export async function getDir() {
  const folderPath = await ipcRenderer.invoke("selectDirectory");
  if (folderPath == undefined) return "";
  return folderPath;
}
export async function getFile() {
  const filePath = await ipcRenderer.invoke("selectFile");
  if (filePath == undefined) return "";
  return filePath;
}

export async function fetchAllData(xlsxFile) {
  const jsonData = await ipcRenderer.invoke("fetchAllData", xlsxFile);

  return jsonData;
}

export async function getAudit() {
  const auditLS = JSON.parse(window.localStorage.getItem("auditArray")) ?? [];
  return auditLS;
}

export async function addAudit(newAudit) {
  const auditLS = JSON.parse(localStorage.getItem("auditArray")) ?? [];
  const date = await getDate();
  newAudit.timeStamp = date.day + "/" + date.month + "/" + date.year + " " + date.time;
  auditLS.unshift(newAudit);
  localStorage.setItem("auditArray", JSON.stringify(auditLS));
}

export async function getDate() {
  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let hours = date.getHours()
  let minutes = date.getMinutes();
  let time = hours + ":" + minutes 

  return { day, month, year, time };
}