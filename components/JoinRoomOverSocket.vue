<template>
  <div>
    <slot></slot>
    <div id="video-chat-lobby" ref="divVideoChatLobby">
      <h2 class="text">Video Chat Application</h2>
      <input id="roomName" type="text" placeholder="Room Name" ref="roomInput" />
      <button id="join" @click="joinRoom">Join</button>
    </div>
    <div id="video-chat-room">
      <video id="user-video" ref="userVideo" autoplay muted playsinline style="width: 320px; height: 240px;"></video>
      <video id="peer-video" ref="peerVideo" autoplay playsinline style="width: 320px; height: 240px;"></video>
      <button @click="toggleMic">Toggle Microphone</button>
      <button @click="toggleCamera">Toggle Camera</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';

const config = useRuntimeConfig();
const socketUrl = config.public.SOCKET_URL;
const socket = io.connect(socketUrl);
const divVideoChatLobby = ref(null);
const userVideo = ref(null);
const peerVideo = ref(null);
const roomInput = ref(null);
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

// Contains the stun server URL we will be using.
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const joinRoom = () => {
  if (roomInput.value.value === '') {
    alert('Please enter a room name');
  } else {
    roomName = roomInput.value.value;
    socket.emit('join', roomName);
  }
};

const OnIceCandidateFunction = (event) => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate, roomName);
  }
};

const OnTrackFunction = (event) => {
  peerVideo.value.srcObject = event.streams[0];
  peerVideo.value.onloadedmetadata = function (e) {
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

socket.on('created', () => {
  creator = true;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then((stream) => {
      userStream = stream;
      divVideoChatLobby.value.style = 'display:none';
      userVideo.value.srcObject = stream;
      userVideo.value.onloadedmetadata = function (e) {
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
      userStream = stream;
      divVideoChatLobby.value.style = 'display:none';
      userVideo.value.srcObject = stream;
      userVideo.value.onloadedmetadata = function (e) {
        userVideo.value.play();
      };
      socket.emit('ready', roomName);
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
        socket.emit('offer', offer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

socket.on('candidate', (candidate) => {
  const icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

socket.on('offer', (offer) => {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

socket.on('answer', (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

onMounted(() => {
  divVideoChatLobby.value = document.getElementById('video-chat-lobby');
  userVideo.value = document.getElementById('user-video');
  peerVideo.value = document.getElementById('peer-video');
  roomInput.value = document.getElementById('roomName');
});
</script>

<style scoped>
body {
  background-color: black;
  font-family: 'Helvetica';
}

h2 {
  font-size: 18px;
  padding: 10px 20px;
  color: #ffffff;
}

#video-chat-lobby {
  text-align: center;
  max-width: 600px;
  background-color: #141414;
  margin: 30px auto;
}

#chat-window {
  height: 400px;
  overflow: auto;
  background: #f9f9f9;
}

#output p {
  padding: 14px 0px;
  margin: 0 20px;
  border-bottom: 1px solid #e9e9e9;
  color: #555;
}

#feedback p {
  color: #aaa;
  padding: 14px 0px;
  margin: 0 20px;
}

#output strong {
  color: #000000;
}

label {
  box-sizing: border-box;
  display: block;
  padding: 10px 20px;
}

input {
  padding: 20px;
  box-sizing: border-box;
  background: #eee;
  display: block;
  width: 100%;
  background: rgb(255, 253, 253);
  font-family: Nunito;
  font-size: 16px;
}

button {
  background: #141414;
  color: #fff;
  font-size: 18px;
  padding: 12px 0;
  width: 100%;
}
</style>
