import { ref } from 'vue';

enum SocketErrorMsgEnum {
  closed = 'Websocket 已斷線！',
  error = 'Websocket 連線失敗！',
}

export const useWebSocket = () => {
  const socketRef = ref<WebSocket | undefined>(undefined);
  const errorRef = ref<SocketErrorMsgEnum | undefined>(undefined);
  let reconnectTimeout: NodeJS.Timeout | undefined = undefined;

  const connect = async () => {
    // console.log('=== - 1', socketRef.value?.readyState)
    if (
      socketRef.value && socketRef.value.readyState != WebSocket.CLOSED
    ) {
      return
    }
    // console.log('=== - 2', socketRef.value?.readyState)
  
    if (socketRef.value) {
      socketRef.value.onclose = null; // 清除旧的 onclose 防止误触发重连
      socketRef.value.close();
    }
  
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socketRef.value = new WebSocket(`${wsProtocol}//${window.location.host}/im-ws?token=${'tokenTest'}`);
    // console.log('=== - 3', socketRef.value?.readyState)
  
    socketRef.value.onopen = () => {
      // console.log('WebSocket connected');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
    };
  
    socketRef.value.onclose = () => {
      errorRef.value = SocketErrorMsgEnum.closed
    };
  
    socketRef.value.onerror = (error: Event) => {
      errorRef.value = SocketErrorMsgEnum.error
      // attemptReconnect(); // 出現錯誤時候，重新連線。
    };
  
    socketRef.value.onmessage = (message) => {
      console.log('WebSocket message:', message.data);
    };
  };  

  const sendMessage = (msg: string) => {
    if (!socketRef.value || socketRef.value?.readyState != WebSocket.OPEN) {
      return
    }
    socketRef.value.send(msg);
  };
  
  onUnmounted(() => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (!socketRef.value) {
      return
    }
    socketRef.value.onclose = null; // 清除 onclose 防止重連
    socketRef.value.close();
  });

  return {
    socketRef,
    errorRef,
    sendMessage,
    connect,
  };
};
