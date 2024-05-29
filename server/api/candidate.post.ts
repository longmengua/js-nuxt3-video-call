import { getWebRTCRoomByName } from "../middleware/state";

export default defineEventHandler(async (event) => {
  const { candidate, roomName } = await readBody(event)
  const room = await getWebRTCRoomByName(roomName)

  room.clients.forEach((client: any) => client.messages.push({ type: 'candidate', data: candidate }));
  return
})