import { getWebRTCRoomByName } from "../middleware/state"

export default defineEventHandler(async (event) => {
  const { answer, roomName } = await readBody(event)
  const room = await getWebRTCRoomByName(roomName)
  if (!room) {
    throw createError({
      statusCode: 400,
      statusMessage: 'roomName cannot be found',
    })
  }

  if (room?.clients?.length < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'no user in the meeting room',
    })
  }

  if (!room?.clients?.messages) {
    throw createError({
      statusCode: 500,
      statusMessage: 'clients.messages cannot be found',
    })
  }

  WEBRTC_ROOMS_MAP[roomName].clients[1].messages.push({ type: 'answer', data: answer });
  return
})