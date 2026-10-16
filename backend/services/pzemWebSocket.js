import { WebSocket, WebSocketServer } from "ws";

let latestReadings = null;
let webSocketServer = null;

export const attachPzemWebSocket = (server) => {
  webSocketServer = new WebSocketServer({
    server,
    path: "/ws/pzem",
  });

  webSocketServer.on("connection", (socket) => {
    if (latestReadings) {
      socket.send(JSON.stringify({ type: "pzem_update", readings: latestReadings }));
    }
  });

  return webSocketServer;
};

export const broadcastPzemReadings = (readings) => {
  latestReadings = readings;
  const message = JSON.stringify({ type: "pzem_update", readings });

  // The current server may not have initialized its WebSocket endpoint yet.
  if (!webSocketServer) return;

  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};
