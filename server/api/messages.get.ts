import { getWebRTCRoomByName } from "../middleware/state"

export default defineEventHandler(async(event) => {
  const defaultMessagesObj: Array<any> = []
  const query = getQuery(event)
  const roomName: string = query?.roomName as string ?? ""

  const room = await getWebRTCRoomByName(roomName)
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