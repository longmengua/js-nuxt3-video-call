import { d as defineEventHandler, r as readBody, g as getWebRTCRoomByName, c as createError } from '../../runtime.mjs';
import 'node:http';
import 'node:https';
import 'events';
import 'https';
import 'http';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'url';
import 'zlib';
import 'buffer';
import 'fs';
import 'path';
import 'engine.io';
import 'socket.io';
import 'node:fs';
import 'node:url';

const offer_post = defineEventHandler(async (event) => {
  const { offer, roomName } = await readBody(event);
  const room = await getWebRTCRoomByName(roomName);
  if (!room) {
    throw createError({
      statusCode: 400,
      statusMessage: "roomName cannot be found"
    });
  }
  const { clients } = room;
  if ((clients == null ? void 0 : clients.length) < 1) {
    return;
  }
  const client = clients[clients.length - 1];
  if (!(client == null ? void 0 : client.messages)) {
    client.messages = [];
  }
  const offerObj = { type: "offer", data: offer };
  client.messages.push(offerObj);
  return;
});

export { offer_post as default };
//# sourceMappingURL=offer.post.mjs.map
