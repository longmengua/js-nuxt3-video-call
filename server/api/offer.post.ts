export default defineEventHandler(async(event) => {
  const { offer, roomName } = await readBody(event)
  const config = useRuntimeConfig()
  const { WEBRTC_ROOMS_MAP } = config.private

  if (!WEBRTC_ROOMS_MAP) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WEBRTC_ROOMS_MAP should not be undefind',
    })
  }

  const room = WEBRTC_ROOMS_MAP[roomName]
  if (!room) {
    throw createError({
      statusCode: 400,
      statusMessage: 'roomName cannot be found',
    })
  }

  const { clients } = room
  if (clients?.length < 1) {
    return
  }

  const client = clients[clients.length - 1];
  if (!client?.messages) {
    client.messages = []
  }

  const offerObj = { type: 'offer', data: offer }
  client.messages.push(offerObj)
  return
})