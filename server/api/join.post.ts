export default defineEventHandler(async (event) => {
  const { roomName } = await readBody(event)
  const config = useRuntimeConfig()
  const { WEBRTC_ROOMS_MAP, LIMITED_PPL_A_ROOM } = config.private

  if (!WEBRTC_ROOMS_MAP) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WEBRTC_ROOMS_MAP should not be undefind',
    })
  }

  if (!LIMITED_PPL_A_ROOM) {
    throw createError({
      statusCode: 500,
      statusMessage: 'LIMITED_PPL_A_ROOM should not be undefind',
    })
  }

  if (!roomName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'roomName cannot be found',
    })
  }

  if (!WEBRTC_ROOMS_MAP[roomName]) {
    return { status: 'created' }
  }

  if (WEBRTC_ROOMS_MAP[roomName].clients.length < LIMITED_PPL_A_ROOM) {
    return { status: 'joined' }
  }
  
  return { status: 'full' }
})
