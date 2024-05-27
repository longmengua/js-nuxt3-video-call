export default defineEventHandler( async(event) => {
  const { roomName } = await readBody(event)
  const config = useRuntimeConfig()
  const { WEBRTC_ROOMS_MAP } = config.private

  if (!WEBRTC_ROOMS_MAP) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WEBRTC_ROOMS_MAP should not be undefind',
    })
  }

  const defaultRoomObj = { clients: [] };
  if (!WEBRTC_ROOMS_MAP[roomName]) {
    WEBRTC_ROOMS_MAP[roomName] = defaultRoomObj;
  }

  const room = WEBRTC_ROOMS_MAP[roomName];
  room.client.push({ id: Date.now(), messages: [] });
  return
})