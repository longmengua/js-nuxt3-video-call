export default defineEventHandler(async(event) => {
  const query = getQuery(event)
  const roomName: string = query?.roomName as string ?? ""
  const config = useRuntimeConfig()
  const { WEBRTC_ROOMS_MAP } = config.private
  const defaultMessagesObj: Array<any> = []

  if (!WEBRTC_ROOMS_MAP) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WEBRTC_ROOMS_MAP should not be undefind',
    })
  }

  const room = WEBRTC_ROOMS_MAP[roomName]
  if (!room) {
    return defaultMessagesObj
  }

  const { clients } = room
  if (clients?.length < 1) {
    return defaultMessagesObj
  }

  const client = clients[clients.length - 1];
  if (!client?.messages) {
    client.messages = defaultMessagesObj
  }

  return client.messages
})