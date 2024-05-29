import { d as defineEventHandler, r as readBody, g as getWebRTCRoomByName } from '../../runtime.mjs';
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

const candidate_post = defineEventHandler(async (event) => {
  const { candidate, roomName } = await readBody(event);
  const room = await getWebRTCRoomByName(roomName);
  room.clients.forEach((client) => client.messages.push({ type: "candidate", data: candidate }));
  return;
});

export { candidate_post as default };
//# sourceMappingURL=candidate.post.mjs.map
