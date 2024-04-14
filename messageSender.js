const fs = require("fs");
const path = require("path");
const { fetchDataFromXLSX, fetchSampleDataFromXLSX } = require("./fetchData");

function applyTemplate(message, obj, ownVariables) {
  const newObj = {
    ...obj,
    ...ownVariables,
  };
  for (const key in newObj) {
    const lookup = new RegExp(`{${key}}`, "g");
    // const lookup2 = new RegExp(`\n`, "g");
    const value = newObj[key];
    if (lookup.test(message)) {
      message = message.replace(lookup, value);
    }
  }
  return message;
}

async function parseTestMsje(data){
  const sampleData = await fetchSampleDataFromXLSX(data.xlsxFile);
  const parsedMsje = await applyTemplate(data.msje, sampleData[1], {});
  return parsedMsje;
}

async function parseEntries(data) {
  // data = {xlsxFile, msje}
  const xlsxData = await fetchDataFromXLSX(data.xlsxFile);

  const clientData = [];
  for(const el of xlsxData) {
    const obj = await parsedMessages(el, data.msje); // {cellID, parsedNumber, parsedMsje}
    clientData.push(obj)
  };

  return clientData; // [{cellID, parsedNumber, parsedMsje}, {}]
}

async function parsedMessages(clientData, msje) {
  // data = {xlsxFile, msje}
  const parsedMsje = await applyTemplate(msje, clientData);
  const number =
    clientData.number ||
    clientData.Number ||
    clientData.numero ||
    clientData.Numero ||
    clientData.telefono ||
    clientData.Telefono ||
    "";
  const parsedNumber = `549${number}@c.us`;
  const newClientData = {
    nonParsedNumber: number,
    number: parsedNumber,
    msje: parsedMsje,
    cellID: `A${clientData.xlsxCellId}`,
  };
  return newClientData; // {cellID, nonParsedNumber, parsedNumber, parsedMsje}
}

module.exports = {  parseEntries, parseTestMsje };
