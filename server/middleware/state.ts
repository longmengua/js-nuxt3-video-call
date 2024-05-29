const globalState: {
    webRTCRoomMap: Record<string, any>
} = {
    webRTCRoomMap: {}
}

export async function getDefaultWebRTCRoomObj(): Promise<Record<string, any>> {
    const config = useRuntimeConfig();
    return  config.private.WEBRTC_ROOMS_MAP
}

export async function getWebRTCRoomByName(roomName: string): Promise<any> {
    if (globalState.webRTCRoomMap[roomName]) {
        return globalState.webRTCRoomMap[roomName]
    }

    const defaultRoomObj = { clients: [] };
    globalState.webRTCRoomMap[roomName] = defaultRoomObj
    return globalState.webRTCRoomMap[roomName]
}

export default defineEventHandler(async (event) => {
    if (!globalState.webRTCRoomMap) {
        globalState.webRTCRoomMap = await getDefaultWebRTCRoomObj()
    }
    // Attach the global state to the request context
    event.context.globalState = globalState;
});