import { d as defineEventHandler, r as readBody, u as useRuntimeConfig, c as createError, g as getWebRTCRoomByName } from '../../runtime.mjs';
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

const join_post = defineEventHandler(async (event) => {
  const { roomName } = await readBody(event);
  const config = useRuntimeConfig();
  const { LIMITED_PPL_A_ROOM } = config.private;
  if (!LIMITED_PPL_A_ROOM) {
    throw createError({
      statusCode: 500,
      statusMessage: "LIMITED_PPL_A_ROOM should not be undefind"
    });
  }
  if (!roomName) {
    throw createError({
      statusCode: 500,
      statusMessage: "roomName cannot be found"
    });
  }
  const room = await getWebRTCRoomByName(roomName);
  if (!room) {
    return { status: "created" };
  }
  if (room.clients.length < LIMITED_PPL_A_ROOM) {
    return { status: "joined" };
  }
  return { status: "full" };
});

export { join_post as default };
//# sourceMappingURL=join.post.mjs.map
