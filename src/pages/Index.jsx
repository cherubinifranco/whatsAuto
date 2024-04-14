import React from "react";
import { useEffect, useState } from "react";
import {
  checkStatus,
  addAudit,
  getFile,
  loadTemplateDataFromXlsx,
  sendMessages,
  checkData,
  sendTestMsje,
} from "../utils";
import {
  DatabaseIcon,
  CheckIcon,
  LoadingIcon,
  CloseIcon2,
  CloudIcon,
  FileIcon,
} from "../components/Icons";
import Modal from "../components/Modal";
const { ipcRenderer } = window.require("electron");

export default function IndexPage() {
  const [showModal, updateShowModal] = useState(false);
  const [modalData, updateModalData] = useState("");
  const [session, updateSession] = useState("loading");
  const [totalSended, updateTotalSended] = useState(0);
  const [xlsxFile, updateXlsxFile] = useState(() => "");
  const [files, updateFiles] = useState(() => "");

  useEffect(() => {
    const totalSendedLS = JSON.parse(localStorage.getItem("totalSended")) ?? 0;
    const xlsxFileLS = localStorage.getItem("xlsxFile") || "";
    const sessionLS = sessionStorage.getItem("session") ?? "loading";
    const filesLS = localStorage.getItem("files") || "";

    updateFiles(filesLS);
    updateSession(sessionLS);
    updateTotalSended(totalSendedLS);
    updateXlsxFile(xlsxFileLS);

    ipcRenderer.on("handleSession", (event, state) =>
      handleSessionUpdate(state)
    );

    return () => {
      ipcRenderer.removeAllListeners("handleSession");
    };
  }, []);

  const handleTestMsje = async () => {
    const data = await sendTestMsje();
    updateModalData(data);
    updateShowModal(true);
  };

  async function updateXLSX() {
    const path = await getFile();
    localStorage.setItem("xlsxFile", path);
    updateXlsxFile(path);
    if (path) {
      const data = await loadTemplateDataFromXlsx(path);
      if (data) {
        localStorage.setItem("templateData", JSON.stringify(data[1]));
      }
    }
  }

  async function addFile() {
    const path = await getFile();
    if (!path) return;
    const filename = path.split("\\").reverse()[0];
    localStorage.setItem("files", path);
    updateFiles(path);
  }

  async function deteleFile() {
    localStorage.setItem("files", "");
    updateFiles("");
  }

  async function handleSendMessages() {
    const msje = localStorage.getItem("msjeToSend") ?? "";
    const newObj = { xlsxFile, msje, files };
    const skip = await checkData(newObj);
    if (skip) {
      updateModalData("Hubo un error al mandar el mensaje. Verifica haber seleccionado un archivo XLSX, y haber escrito un mensaje")
      updateShowModal(true)
      return;
    }
    updateModalData("Se estan enviando los mensajes")
    updateShowModal(true)

    const [errors, sended] = await sendMessages(newObj);
    const newTotalSended = totalSended + sended.length;
    updateTotalSended(newTotalSended);
    localStorage.setItem("totalSended", newTotalSended);
    addAudit({
      title: "Envio de mensajes",
      body: `Se enviaron mensajes con ${sended.length} resultados positivos, y ${errors.length} resultados negativos`,
      extra: errors,
    });
  }

  const handleSessionUpdate = (state) => {
    sessionStorage.setItem("session", state);
    updateSession(state);
  };

  return (
    <main className="text-white w-[700px] gap-4 flex flex-col">
      {session == "inactive" && (
        <div className="h-20 w-full font-semibold tracking-wide border-2 border-red-400 text-red-400 flex items-center justify-around rounded-lg">
          <h1 className="w-80">Falta inicio de sesion</h1>
          {CloseIcon2}
        </div>
      )}
      {session == "active" && (
        <div className="h-20 w-full font-semibold tracking-wide  border-2 border-accent text-accent flex items-center justify-around rounded-lg">
          <h1 className="w-80">Listo para enviar</h1>
          {CheckIcon}
        </div>
      )}
      {session == "loading" && (
        <div className="h-20 w-full font-semibold tracking-wide  border-2 border-extra text-extra flex items-center justify-around rounded-lg">
          <h1 className="w-80">Cargando...</h1>
          {LoadingIcon}
        </div>
      )}
      <div className="flex flex-row justify-around">
        <a
          className="bg-content p-6 rounded-lg font-semibold hover:bg-extracontent"
          href="#/configuracion"
        >
          Configuracion
        </a>

        <a
          className="bg-content p-6 rounded-lg font-semibold hover:bg-extracontent"
          href="#/auditoria"
        >
          Ultimos Movimientos
        </a>

        <div className="bg-content p-6 rounded-lg font-semibold">
          Total de
          <span className="p-4 text-accent bg-extracontent rounded-lg m-4">
            {totalSended}
          </span>
          Mensajes Enviados
        </div>
      </div>

      <div className="relative" title={"Archivo Excel"}>
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
          {DatabaseIcon}
        </div>
        <input
          value={xlsxFile}
          readOnly
          type="text"
          className="hover:cursor-pointer border text-sm rounded-lg block w-full ps-10 p-2.5  bg-extracontent border-border placeholder-gray-400 text-white hover:bg-extra"
          placeholder="Archivo Excel"
          onClick={updateXLSX}
        />
      </div>

      <div className="flex flex-row justify-around gap-6">
        <a
          className="py-2.5 px-5 w-60 text-sm font-bold rounded-lg bg-accent2 text-white hover:bg-accent text-center"
          href="#/mensajes"
        >
          Editar Mensaje
        </a>
        <button
          disabled={session !== "active"}
          className={
            "py-2.5 px-5 w-60 text-sm font-bold rounded-lg bg-accent2 text-white text-center" +
            (session == "active"
              ? " hover:bg-accent"
              : " bg-slate-600 text-gray-200 border-gray-700")
          }
          onClick={handleTestMsje}
        >
          Envio de prueba
        </button>
      </div>
      <div className="flex items-center justify-center w-full">
        <button
          type="button"
          onClick={files == "" ? addFile : deteleFile}
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer dark:hover:bg-extra bg-extracontent border-border hover:border-gray-500 hover:bg-gray-600"
        >
          {files == "" ? (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {CloudIcon}
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">
                  Click para cargar una imagen
                </span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">{files}</span>
              </p>
            </div>
          )}
        </button>
      </div>

      <button
        disabled={session !== "active"}
        type="button"
        className={
          "py-2.5 px-5 text-sm font-bold rounded-lg border bg-accent2 text-mainbg border-blue-600 text-white" +
          (session == "active"
            ? " hover:bg-accent"
            : " bg-slate-600 text-gray-200 border-gray-700")
        }
        onClick={handleSendMessages}
      >
        Enviar
      </button>
      {showModal && (
        <Modal title="" onExit={updateShowModal}>
          <h1 className="p-4">{modalData}</h1>
        </Modal>
      )}
    </main>
  );
}
