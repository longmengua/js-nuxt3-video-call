import { d as defineEventHandler, a as getQuery, g as getWebRTCRoomByName } from '../../runtime.mjs';
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

const messages_get = defineEventHandler(async (event) => {
  var _a;
  const defaultMessagesObj = [];
  const query = getQuery(event);
  const roomName = (_a = query == null ? void 0 : query.roomName) != null ? _a : "";
  const room = await getWebRTCRoomByName(roomName);
  if (!room) {
    return defaultMessagesObj;
  }
  const { clients } = room;
  if ((clients == null ? void 0 : clients.length) < 1) {
    return defaultMessagesObj;
  }
  const client = clients[clients.length - 1];
  if (!(client == null ? void 0 : client.messages)) {
    client.messages = defaultMessagesObj;
  }
  return client.messages;
});

export { messages_get as default };
//# sourceMappingURL=messages.get.mjs.map
