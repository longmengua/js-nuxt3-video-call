import { getWebRTCRoomByName } from "../middleware/state"

export default defineEventHandler(async (event) => {
  const { roomName } = await readBody(event)
  const config = useRuntimeConfig()
  const { LIMITED_PPL_A_ROOM } = config.private

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

  const room = await getWebRTCRoomByName(roomName)
  if (!room) {
    return { status: 'created' }
  }

  if (room.clients.length < LIMITED_PPL_A_ROOM) {
    return { status: 'joined' }
  }
  
  return { status: 'full' }
})
