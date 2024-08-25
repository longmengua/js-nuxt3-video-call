<template>
  <div>
    <div class="video-chat-lobby" :style="{display: isOpenRoom ? 'none' : 'block'}">
      <h2 class="text">Video Chat Application</h2>
      <input
        class="room-name"
        type="text"
        v-model="roomName"
        placeholder="Room Name"
      />
      <button class="join-btn" @click="joinRoom">Join</button>
    </div>
    <div class="video-group" :style="{display: !isOpenRoom ? 'none' : 'block'}">
      <div class="toggle-btns">
        <button @click="toggleScreenShare">Toggle Screen Share</button>
        <button @click="undo">Undo move in canvas</button>
        <button @click="toggleMic">Toggle Microphone</button>
        <button @click="toggleCamera">Toggle Camera</button>
      </div>
      <div class="video-shared-group" style="position: relative;">
        <video
          class="screen-video"
          ref="screenVideo"
          autoplay
          playsinline
          style="width: 900px; height: 450px; border: 1px solid black;"
        ></video>
        <canvas
          width="900"
          height="450"
          style="border: 1px solid black;position: absolute;top: 0;left: 0;"
          ref="canvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
        ></canvas>
      </div>
      <div class="video-chat-room">
        <video
          class="user-video"
          ref="userVideo"
          autoplay
          muted
          playsinline
          style="width: 320px; height: 240px; border: 1px solid black;"
        ></video>
        <video
          class="peer-video"
          ref="peerVideo"
          autoplay
          playsinline
          style="width: 320px; height: 240px; border: 1px solid black;"
        ></video>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';

const config = useRuntimeConfig();
const socketUrl = config.public.SOCKET_URL;
const socket = io.connect(socketUrl);
const userVideo = ref(null);
const peerVideo = ref(null);
const screenVideo = ref(null);
const roomName = ref('');
const isScreenSharing = ref(false);
const drawingHistory = ref([]);
const canvas = ref(null);
const isOpenRoom = ref(false);

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
  x1 = e.offsetX || e.touches[0].clientX - canvas.value.offsetLeft;
  y1 = e.offsetY || e.touches[0].clientY - canvas.value.offsetTop;

  const ctx = canvas.value.getContext('2d');

  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  currentStep = [{ type: 'beginPath', x: x1, y: y1 }];
};

const onMouseMove = (e) => {
  if (!isMouseActive) return;

  x2 = e.offsetX || e.touches[0].clientX - canvas.value.offsetLeft;
  y2 = e.offsetY || e.touches[0].clientY - canvas.value.offsetTop;

  const ctx = canvas.value.getContext('2d');

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
    drawingHistory.value.push(currentStep);
    currentStep = [];
  }
  isMouseActive = false;
};

const undo = () => {
  if (drawingHistory.value.length === 0) return;

  const ctx = canvas.value.getContext('2d');

  drawingHistory.value.pop();
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.beginPath();

  drawingHistory.value.forEach(step => {
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
  peerVideo.value.srcObject = event.streams[0];
  peerVideo.value.onloadedmetadata = function () {
    peerVideo.value.play();
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
  if (isScreenSharing.value) {
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
    screenVideo.value.srcObject = screenStream;
    screenVideo.value.onloadedmetadata = function () {
      screenVideo.value.play();
    };

    // Add the screen track to the RTCPeerConnection
    const sender = rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
    sender.replaceTrack(screenTrack);

    screenTrack.onended = () => {
      stopScreenShare();
    };

    isScreenSharing.value = true;
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
  screenVideo.value.srcObject = null;
  screenStream.getTracks().forEach((track) => track.stop());
  isScreenSharing.value = false;
};

socket.on('created', () => {
  creator = true;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      isOpenRoom.value = true;
      userStream = stream;
      userVideo.value.srcObject = stream;
      userVideo.value.onloadedmetadata = function () {
        userVideo.value.play();
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
      isOpenRoom.value = true;
      userStream = stream;
      userVideo.value.srcObject = stream;
      userVideo.value.onloadedmetadata = function () {
        userVideo.value.play();
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
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.toggle-btns {
  margin-bottom: 10px;
}

.video-shared-group {
  position: relative;
}

.video-chat-room {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
</style>
