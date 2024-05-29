import { getWebRTCRoomByName } from "../middleware/state";

export default defineEventHandler( async(event) => {
  const { roomName } = await readBody(event)
  const room = await getWebRTCRoomByName(roomName)

  room.client.push({ id: Date.now(), messages: [] });
  return
})