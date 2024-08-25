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
            :style="{ width: `${uiState.videoSharing.width}px`, height: `${uiState.videoSharing.height}px`, border: '1px solid black', position: 'absolute', top: '0', left: '0' }"
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

let isMouseActive = false;
let x1, x2, y1, y2 = 0;
let currentStep = [];
let creator = false;
let rtcPeerConnection;
let userStream;
let screenStream;

// Contains the stun server URL we will be using.
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const onMouseDown = (e) => {
  isMouseActive = true;
  x1 = e.offsetX || e.touches[0].clientX - canvasRef.value.offsetLeft;
  y1 = e.offsetY || e.touches[0].clientY - canvasRef.value.offsetTop;

  const ctx = canvasRef.value.getContext('2d');

  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  currentStep = [{ type: 'beginPath', x: x1, y: y1 }];
};

const onMouseMove = (e) => {
  if (!isMouseActive) return;

  x2 = e.offsetX || e.touches[0].clientX - canvasRef.value.offsetLeft;
  y2 = e.offsetY || e.touches[0].clientY - canvasRef.value.offsetTop;

  const ctx = canvasRef.value.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "yellow";
  ctx.stroke();

  currentStep.push({ type: 'lineTo', x: x2, y: y2 });

  x1 = x2;
  y1 = y2;
};

const onMouseUp = () => {
  if (isMouseActive && currentStep.length > 0) {
    uiState.value.drawingHistory.push(currentStep);
    currentStep = [];
  }
  isMouseActive = false;
};

const undo = () => {
  if (uiState.value.drawingHistory.length === 0) return;

  const ctx = canvasRef.value.getContext('2d');

  uiState.value.drawingHistory.pop();
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
  const audioTrack = userStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
};

const toggleCamera = () => {
  const videoTrack = userStream.getVideoTracks()[0];
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
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getTracks()[0];

    // Display the screen stream in the screenVideo element locally
    screenVideoRef.value.srcObject = screenStream;
    screenVideoRef.value.onloadedmetadata = function () {
      screenVideoRef.value.play();
    };

    // Add the screen track to the RTCPeerConnection
    const sender = rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
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
  const videoTrack = userStream.getVideoTracks()[0];

  // Replace the screen track with the original video track
  const sender = rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
  sender.replaceTrack(videoTrack);

  // Clear the screenVideo element and revert to webcam stream
  screenVideoRef.value.srcObject = null;
  screenStream.getTracks().forEach((track) => track.stop());
  uiState.value.isScreenSharing = false;
};

socket.on('created', () => {
  creator = true;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      uiState.value.isOpenRoom = true;
      userStream = stream;
      userVideoRef.value.srcObject = stream;
      userVideoRef.value.onloadedmetadata = function () {
        userVideoRef.value.play();
      };
    })
    .catch((err) => {
      alert("Couldn't Access User Media");
    });
});

socket.on('joined', () => {
  creator = false;
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      uiState.value.isOpenRoom = true;
      userStream = stream;
      userVideoRef.value.srcObject = stream;
      userVideoRef.value.onloadedmetadata = function () {
        userVideoRef.value.play();
      };
      socket.emit('ready', roomName.value);
    })
    .catch((err) => {
      alert("Couldn't Access User Media");
    });
});

socket.on('full', () => {
  alert("Room is Full, Can't Join");
});

socket.on('ready', () => {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, roomName.value);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

socket.on('candidate', (icecandidate) => {
  rtcPeerConnection.addIceCandidate(icecandidate);
});

socket.on('offer', (offer) => {
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
  rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  rtcPeerConnection
    .createAnswer()
    .then((answer) => {
      rtcPeerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, roomName.value);
    })
    .catch((error) => {
      console.log(error);
    });
});

socket.on('answer', (answer) => {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
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
