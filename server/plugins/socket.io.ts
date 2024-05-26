import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { Server, Socket } from "socket.io";
import { defineEventHandler } from "h3";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  io.on("connection", (socket: Socket) => {
    console.log("User Connected: " + socket.id);

    // Triggered when a peer hits the join room button
    socket.on("join", (roomName: string) => {
        const rooms = io.sockets.adapter.rooms;
        const room = rooms.get(roomName);

        // room === undefined when no such room exists
        if (room === undefined) {
        socket.join(roomName);
        socket.emit("created");
        } else if (room.size === 1) {
        // room.size === 1 when one person is inside the room
        socket.join(roomName);
        socket.emit("joined");
        } else {
        // when there are already two people inside the room
        socket.emit("full");
        }
        console.log(rooms);
    });

    // Triggered when the person who joined the room is ready to communicate
    socket.on("ready", (roomName: string) => {
        socket.broadcast.to(roomName).emit("ready"); // Informs the other peer in the room
    });

    // Triggered when server gets an ICE candidate from a peer in the room
    socket.on("candidate", (candidate: RTCIceCandidate, roomName: string) => {
        console.log(candidate);
        socket.broadcast.to(roomName).emit("candidate", candidate); // Sends candidate to the other peer in the room
    });

    // Triggered when server gets an offer from a peer in the room
    socket.on("offer", (offer: RTCSessionDescriptionInit, roomName: string) => {
        socket.broadcast.to(roomName).emit("offer", offer); // Sends offer to the other peer in the room
    });

    // Triggered when server gets an answer from a peer in the room
    socket.on("answer", (answer: RTCSessionDescriptionInit, roomName: string) => {
        socket.broadcast.to(roomName).emit("answer", answer); // Sends answer to the other peer in the room
    });
  });

  nitroApp.router.use("/socket.io/", defineEventHandler({
    handler(event) {
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
    },
    websocket: {
      open(peer) {
        const nodeContext = peer.ctx.node;
        const req = nodeContext.req;

        // @ts-expect-error private method
        engine.prepare(req);

        const rawSocket = nodeContext.req.socket;
        const websocket = nodeContext.ws;

        // @ts-expect-error private method
        engine.onWebSocket(req, rawSocket, websocket);
      }
    }
  }));
});