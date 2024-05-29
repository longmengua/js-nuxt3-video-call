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

const answer_post = defineEventHandler(async (event) => {
  var _a, _b;
  const { answer, roomName } = await readBody(event);
  const room = await getWebRTCRoomByName(roomName);
  if (!room) {
    throw createError({
      statusCode: 400,
      statusMessage: "roomName cannot be found"
    });
  }
  if (((_a = room == null ? void 0 : room.clients) == null ? void 0 : _a.length) < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "no user in the meeting room"
    });
  }
  if (!((_b = room == null ? void 0 : room.clients) == null ? void 0 : _b.messages)) {
    throw createError({
      statusCode: 500,
      statusMessage: "clients.messages cannot be found"
    });
  }
  WEBRTC_ROOMS_MAP[roomName].clients[1].messages.push({ type: "answer", data: answer });
  return;
});

export { answer_post as default };
//# sourceMappingURL=answer.post.mjs.map
