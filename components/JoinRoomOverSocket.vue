<template>
  <div>
    <div class="video-chat-lobby" :style="{display: uiState.isOpenRoom ? 'none' : 'block'}">
      <h2 class="text">Video Chat Application</h2>
      <input
        v-model="roomName"
        class="room-name"
        type="text"
        placeholder="Room Name"
      />
      <button class="join-btn" @click="joinRoom">Join</button>
    </div>
    <div :style="{display: !uiState.isOpenRoom ? 'none' : 'block'}">
      <div class="video-group">
        <div class="video-shared-group" :style="{ position: 'relative', width: `${uiState.videoWidth}px`, height: `${uiState.videoHeight}px` }">
          <video
            ref="screenVideoRef"
            class="screen-video"
            autoplay
            playsinline
            :style="{ width: `${uiState.videoSharing.width}px`, height: `${uiState.videoSharing.height}px`, border: '1px solid black' }"
          ></video>
          <canvas
            ref="canvasRef"
            :width="`${uiState.videoSharing.width}px`"
            :height="`${uiState.videoSharing.height}px`"
            :style="{ border: '1px solid black', position: 'absolute', top: '0', left: '0' }"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
          ></canvas>
        </div>
        <div class="video-chat-room">
          <video
            ref="userVideoRef"
            class="user-video"
            autoplay
            muted
            playsinline
            :style="{ width: '320px', height: '240px', border: '1px solid black' }"
          ></video>
          <video
            ref="peerVideoRef"
            class="peer-video"
            autoplay
            playsinline
            :style="{ width: '320px', height: '240px', border: '1px solid black' }"
          ></video>
        </div>
        <div class="toggle-btns">
          <button @click="toggleScreenShare">Toggle Screen Share</button>
          <button @click="undo">Undo move in canvas</button>
          <button @click="toggleMic">Toggle Microphone</button>
          <button @click="toggleCamera">Toggle Camera</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const userVideoRef = ref(null);
const peerVideoRef = ref(null);
const screenVideoRef = ref(null);
const canvasRef = ref(null);
const roomName = ref('');

const uiState = ref({
  isOpenRoom: false,
  isScreenSharing: false,
  drawingHistory: [],
  videoSharing: {
    width: 650,
    height: 450,
  }
});

const state = {
  isMouseActive: false,
  x1: 0,
  x2: 0,
  y1: 0,
  y2: 0,
  currentStep: [],
  rtcPeerConnection: null,
  userStream: null,
  screenStream: null,
  creator: false,
};

const iceServers = {
  iceServers: [
    // {
    //   urls: 'turn:localhost:3478',
    //   username: 'user',
    //   credential: '1234qwer'
    // },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const ws = ref(null);

const getCanvasContext = () => {
  const ctx = canvasRef.value.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = "red";
  return ctx
}

const onMouseDown = (e) => {
  state.isMouseActive = true;

  const rect = canvasRef.value.getBoundingClientRect();
  state.x1 = e.clientX - rect.left;
  state.y1 = e.clientY - rect.top;

  state.currentStep = [{ type: 'beginPath', x: state.x1, y: state.y1 }];
};

const onMouseMove = (e) => {
  if (!state.isMouseActive) return;

  const rect = canvasRef.value.getBoundingClientRect();
  state.x2 = e.clientX - rect.left;
  state.y2 = e.clientY - rect.top;

  const ctx = getCanvasContext();
  ctx.beginPath();
  ctx.moveTo(state.x1, state.y1);
  ctx.lineTo(state.x2, state.y2);
  ctx.stroke();

  state.currentStep.push({ type: 'lineTo', x: state.x2, y: state.y2 });
  state.x1 = state.x2;
  state.y1 = state.y2;
};

const onMouseUp = () => {
  if (state.isMouseActive && state.currentStep.length > 0) {
    uiState.value.drawingHistory.push(state.currentStep);
    state.currentStep = [];
  }
  state.isMouseActive = false;
};

const undo = () => {
  if (uiState.value.drawingHistory.length === 0) return;

  uiState.value.drawingHistory.pop();

  const ctx = canvasRef.value.getContext('2d');
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.beginPath();

  uiState.value.drawingHistory.forEach(step => {
    step.forEach(action => {
      if (action.type === 'beginPath') {
        ctx.moveTo(action.x, action.y);
      } else if (action.type === 'lineTo') {
        ctx.lineTo(action.x, action.y);
        ctx.stroke();
      }
    });
  });
};

// Replace the WebSocket initialization part in your Vue component's script
const joinRoom = () => {
  if (roomName.value === '') {
    alert('Please enter a room name');
  } else {
    // Connect to the Nuxt server's WebSocket
    ws.value = new WebSocket('ws://localhost:3000/ws');

    ws.value.onopen = () => {
      console.log('Connected to WebSocket server');
      // Send join room message after opening connection
      ws.value.send(JSON.stringify({ type: 'join', room: roomName.value }));
    };

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle incoming WebSocket messages
      switch (data.type) {
        case 'created':
          onCreated();
          break;
        case 'joined':
          onJoined();
          break;
        case 'full':
          alert("Room is Full, Can't Join");
          break;
        case 'ready':
          if (state.creator) {
            setupRTCPeerConnection();
            createOffer();
          }
          break;
        case 'offer':
          handleOffer(data.offer);
          break;
        case 'answer':
          handleAnswer(data.answer);
          break;
        case 'candidate':
          handleCandidate(data.candidate);
          break;
        default:
          break;
      }
    };
  }
};

const onCreated = async () => {
  state.creator = true;
  await setupStream();
};

const onJoined = async () => {
  state.creator = false;
  await setupStream();
  ws.value.send(JSON.stringify({ type: 'ready', room: roomName.value }));
};

const setupStream = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  uiState.value.isOpenRoom = true;
  state.userStream = mediaStream;
  userVideoRef.value.srcObject = mediaStream;
  userVideoRef.value.onloadedmetadata = function () {
    userVideoRef.value.play();
  };

  // Disable mic initially
  toggleMic();
  // Disable video initially
  // toggleCamera();
};

const setupRTCPeerConnection = () => {
  state.rtcPeerConnection = new RTCPeerConnection(iceServers);
  state.rtcPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.value.send(JSON.stringify({ type: 'candidate', candidate: event.candidate, room: roomName.value }));
    }
  };

  state.rtcPeerConnection.ontrack = (event) => {
    peerVideoRef.value.srcObject = event.streams[0];
    peerVideoRef.value.onloadedmetadata = function () {
      peerVideoRef.value.play();
    };
  };

  state.rtcPeerConnection.addTrack(state.userStream.getTracks()[0], state.userStream);
  state.rtcPeerConnection.addTrack(state.userStream.getTracks()[1], state.userStream);
};

const createOffer = () => {
  state.rtcPeerConnection.createOffer()
    .then((offer) => {
      state.rtcPeerConnection.setLocalDescription(offer);
      ws.value.send(JSON.stringify({ type: 'offer', offer, room: roomName.value }));
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
};

const handleOffer = (offer) => {
  setupRTCPeerConnection();
  state.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  state.rtcPeerConnection.createAnswer()
    .then((answer) => {
      state.rtcPeerConnection.setLocalDescription(answer);
      ws.value.send(JSON.stringify({ type: 'answer', answer, room: roomName.value }));
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
};

const handleAnswer = (answer) => {
  state.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

const handleCandidate = (candidate) => {
  state.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

const toggleMic = () => {
  const audioTrack = state.userStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
};

const toggleCamera = () => {
  const videoTrack = state.userStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
};

const toggleScreenShare = async () => {
  if (uiState.value.isScreenSharing) {
    stopScreenShare();
  } else {
    await startScreenShare();
  }
};

const startScreenShare = async () => {
  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = state.screenStream.getTracks()[0];

    screenVideoRef.value.srcObject = state.screenStream;
    screenVideoRef.value.onloadedmetadata = function () {
      screenVideoRef.value.play();
    };

    const sender = state.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
    sender.replaceTrack(screenTrack);

    screenTrack.onended = () => {
      stopScreenShare();
    };

    uiState.value.isScreenSharing = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error sharing screen: ", error);
  }
};

const stopScreenShare = () => {
  const videoTrack = state.userStream.getVideoTracks()[0];
  const sender = state.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
  sender.replaceTrack(videoTrack);

  screenVideoRef.value.srcObject = null;
  state.screenStream.getTracks().forEach((track) => track.stop());
  uiState.value.isScreenSharing = false;
};

</script>

<style scoped>
.video-chat-lobby {
  text-align: center;
  margin-top: 20px;
}

.text {
  font-size: 24px;
  margin-bottom: 20px;
}

.room-name {
  padding: 10px;
  width: 200px;
}

.join-btn {
  margin-top: 10px;
  padding: 10px 20px;
}

.video-group {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.toggle-btns {
  margin: 20px 0;
}

.video-shared-group {
  position: relative;
}

.video-chat-room {
  display: flex;
}
</style>
