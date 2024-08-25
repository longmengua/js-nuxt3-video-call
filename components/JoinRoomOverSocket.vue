<template>
  <div>
    <div class="video-chat-lobby" :style="{display: uiState.isOpenRoom ? 'none' : 'block'}">
      <h2 class="text">Video Chat Application</h2>
      <input
        class="room-name"
        type="text"
        v-model="roomName"
        placeholder="Room Name"
      />
      <button class="join-btn" @click="joinRoom">Join</button>
    </div>
    <div :style="{display: !uiState.isOpenRoom ? 'none' : 'block'}">
      <div class="video-group">
        <div class="video-shared-group" :style="{ position: 'relative', width: `${videoWidth}px`, height: `${videoHeight}px` }">
          <video
            class="screen-video"
            ref="screenVideoRef"
            autoplay
            playsinline
            :style="{ width: `${uiState.videoSharing.width}px`, height: `${uiState.videoSharing.height}px`, border: '1px solid black' }"
          ></video>
          <canvas
            :width="`${uiState.videoSharing.width}px`"
            :height="`${uiState.videoSharing.height}px`"
            :style="{ border: '1px solid black', position: 'absolute', top: '0', left: '0' }"
            ref="canvasRef"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
          ></canvas>
        </div>
        <div class="video-chat-room">
          <video
            class="user-video"
            ref="userVideoRef"
            autoplay
            muted
            playsinline
            :style="{ width: '320px', height: '240px', border: '1px solid black' }"
          ></video>
          <video
            class="peer-video"
            ref="peerVideoRef"
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
import { io } from 'socket.io-client';

const config = useRuntimeConfig();
const socket = io.connect(config.public.SOCKET_URL);

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
}

// Contains the stun server URL we will be using.
const iceServers = {
  iceServers: [
    {
      urls: 'turn:localhost:3478',
      username: 'user',
      credential: '1234qwer'
    },
    // { urls: 'stun:stun.services.mozilla.com' },
    // { urls: 'stun:stun.l.google.com:19302' },
  ],
};

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

  // Calculate canvas position and size
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

const joinRoom = () => {
  if (roomName.value === '') {
    alert('Please enter a room name');
  } else {
    socket.emit('join', roomName.value);
  }
};

const OnIceCandidateFunction = (event) => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate, roomName.value);
  }
};

const OnTrackFunction = (event) => {
  peerVideoRef.value.srcObject = event.streams[0];
  peerVideoRef.value.onloadedmetadata = function () {
    peerVideoRef.value.play();
  };
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

    // Display the screen stream in the screenVideo element locally
    screenVideoRef.value.srcObject = state.screenStream;
    screenVideoRef.value.onloadedmetadata = function () {
      screenVideoRef.value.play();
    };

    // Add the screen track to the RTCPeerConnection
    const sender = state.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
    sender.replaceTrack(screenTrack);

    screenTrack.onended = () => {
      stopScreenShare();
    };

    uiState.value.isScreenSharing = true;
  } catch (error) {
    console.error("Error sharing screen: ", error);
  }
};

const stopScreenShare = () => {
  const videoTrack = state.userStream.getVideoTracks()[0];

  // Replace the screen track with the original video track
  const sender = state.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
  sender.replaceTrack(videoTrack);

  // Clear the screenVideo element and revert to webcam stream
  screenVideoRef.value.srcObject = null;
  state.screenStream.getTracks().forEach((track) => track.stop());
  uiState.value.isScreenSharing = false;
};

const setupStream = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  uiState.value.isOpenRoom = true;
  state.userStream = mediaStream;
  userVideoRef.value.srcObject = mediaStream;
  userVideoRef.value.onloadedmetadata = function () {
    userVideoRef.value.play();
  };

  // 先關閉mic
  toggleMic();
  // 先關閉 video
  // toggleCamera();
}

socket.on('created', async () => {
  state.creator = true;
  await setupStream()
});

socket.on('joined', async () => {
  state.creator = false;
  await setupStream()
  socket.emit('ready', roomName.value);
});

socket.on('full', () => {
  alert("Room is Full, Can't Join");
});

socket.on('ready', () => {
  if (state.creator) {
    state.rtcPeerConnection = new RTCPeerConnection(iceServers);
    state.rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    state.rtcPeerConnection.ontrack = OnTrackFunction;
    state.rtcPeerConnection.addTrack(state.userStream.getTracks()[0], state.userStream);
    state.rtcPeerConnection.addTrack(state.userStream.getTracks()[1], state.userStream);
    state.rtcPeerConnection
      .createOffer()
      .then((offer) => {
        state.rtcPeerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, roomName.value);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

socket.on('candidate', (icecandidate) => {
  state.rtcPeerConnection.addIceCandidate(icecandidate);
});

socket.on('offer', (offer) => {
  state.rtcPeerConnection = new RTCPeerConnection(iceServers);
  state.rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  state.rtcPeerConnection.ontrack = OnTrackFunction;
  state.rtcPeerConnection.addTrack(state.userStream.getTracks()[0], state.userStream);
  state.rtcPeerConnection.addTrack(state.userStream.getTracks()[1], state.userStream);
  state.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  state.rtcPeerConnection
    .createAnswer()
    .then((answer) => {
      state.rtcPeerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, roomName.value);
    })
    .catch((error) => {
      console.log(error);
    });
});

socket.on('answer', (answer) => {
  state.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

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
