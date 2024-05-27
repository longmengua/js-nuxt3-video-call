export default defineEventHandler(async (event) => {
  const { candidate, roomName } = await readBody(event)
  const config = useRuntimeConfig()
  const { WEBRTC_ROOMS_MAP } = config.private

  if (!WEBRTC_ROOMS_MAP) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WEBRTC_ROOMS_MAP should not be undefind',
    })
  }

  WEBRTC_ROOMS_MAP[roomName].clients.forEach((client: any) => client.messages.push({ type: 'candidate', data: candidate }));
  return
})