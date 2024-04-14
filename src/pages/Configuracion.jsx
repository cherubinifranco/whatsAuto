import { useState, useEffect } from "react";
import { logout, sendTestMsje } from "../utils.js";
import Modal from "../components/Modal.jsx";
const { ipcRenderer } = window.require("electron");

export default function ConfiguracionPage() {
  const [session, updateSession] = useState("loading");
  const [showModal, updateShowModal] = useState(false);
  const [qr, updateQR] = useState("");

  useEffect(() => {
    const qrLS = sessionStorage.getItem("qr") ?? "";
    const sessionLS = sessionStorage.getItem("session") ?? "loading";
    updateSession(sessionLS);
    updateQR(qrLS);
    ipcRenderer.on("handleSession", (event, state) =>
      handleSessionUpdate(state)
    );
    ipcRenderer.on("handleQR", (event, QR) => handleQRUpdate(QR));
    return () => {
      ipcRenderer.removeAllListeners("handleQR");
      ipcRenderer.removeAllListeners("handleSession");
    };
  }, []);

  const handleTestMessage = async () => {
    const data = await sendTestMsje();
    if (data == "Error") {
      updateShowModal(!showModal);
    }
  };

  const handleSessionUpdate = (state) => {
    sessionStorage.setItem("session", state);
    updateSession(state);
  };

  const handleQRUpdate = (QR) => {
    sessionStorage.setItem("qr", QR);
    updateQR(QR);
  };

  function handleDesvincular() {
    logout();
  }

  useEffect(() => {
    const sessionLS = sessionStorage.getItem("session") ?? "inactive";
    updateSession(sessionLS);
  }, []);

  return (
    <main className="text-white w-[700px] gap-3 flex flex-col justify-center">
      <a
        className="py-2.5 px-5 text-sm font-bold rounded-lg bg-accent2 text-white hover:bg-accent w-[120px] text-center"
        href="#/"
      >
        Volver
      </a>
      <div className="gap-3 flex justify-center">
        {session == "inactive" ? (
          <div className="bg-content p-3 border border-red-400 rounded-lg font-semibold flex flex-row justify-around items-center w-96">
            Sesion Inactiva
          </div>
        ) : (
          <div className="bg-content p-3 rounded-lg font-semibold flex flex-row justify-around items-center w-96">
            Sesion Activa
            <button
              type="button"
              className="py-2.5 px-5 text-sm font-bold rounded-lg border bg-accent2 text-mainbg border-blue-600 text-white hover:bg-accent"
              onClick={handleDesvincular}
            >
              Desvincular
            </button>
          </div>
        )}
        {session == "active" && (
          <div className="bg-content p-3 rounded-lg font-semibold flex flex-row justify-around items-center w-96">
            Prueba de Mensaje
            <button
              type="button"
              className="py-2.5 px-5 text-sm font-bold rounded-lg border bg-accent2 text-mainbg border-blue-600 text-white hover:bg-accent"
              onClick={handleTestMessage}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
      {session == "inactive" && (
        <pre
          className="mx-auto my-4 leading-3 tracking-[-1px] text-xs border border-border rounded-lg h-84 w-84 text-center"
          id="qr"
        >
          {qr}
        </pre>
      )}

      {showModal && (
        <Modal
          title={<p className="p-2">Error</p>}
          note=""
          onExit={updateShowModal}
        >
          <div className="p-4 bg-content">
            Hubo un error al momento de mandar el mensaje, se recomienda
            revincular el numero
          </div>
        </Modal>
      )}
    </main>
  );
}
