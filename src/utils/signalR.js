// utils/signalR.js
import * as signalR from "@microsoft/signalr";
import { buildApiAbsoluteUrl } from "../config/api";

export const initSignalR = async (token) => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(buildApiAbsoluteUrl("/adminChatHub"), {
      accessTokenFactory: () => token,
      withCredentials: true,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  // connection.on("ReceiveMessage", (user, message) => {
  //   // console.log("Yeni mesaj gəldi:", user, message);
  // });

  try {
    await connection.start();
    console.log("✅ SignalR connection established!");
  } catch (err) {
    console.error("❌ SignalR connection failed:", err);
  }

  return connection;
};
