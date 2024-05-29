import { getWebRTCRoomByName } from "../middleware/state"

export default defineEventHandler(async(event) => {
  const { offer, roomName } = await readBody(event)
  
  const room = await getWebRTCRoomByName(roomName)
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