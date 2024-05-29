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

const ready_post = defineEventHandler(async (event) => {
  const { roomName } = await readBody(event);
  const room = await getWebRTCRoomByName(roomName);
  room.client.push({ id: Date.now(), messages: [] });
  return;
});

export { ready_post as default };
//# sourceMappingURL=ready.post.mjs.map
