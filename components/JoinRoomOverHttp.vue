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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const divVideoChatLobby = ref(null);
const userVideo = ref(null);
const peerVideo = ref(null);
const roomInput = ref(null);
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const joinRoom = async () => {
  console.log('socket.on joinRoom');
  if (roomInput.value.value === '') {
    alert('Please enter a room name');
  } else {
    roomName = roomInput.value.value;
    const response = await fetch('/api/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    });
    const result = await response.json();
    if (result.status === 'created') {
      onCreated();
    } else if (result.status === 'joined') {
      onJoined();
    } else if (result.status === 'full') {
      alert("Room is Full, Can't Join");
    }
  }
};

const onCreated = async () => {
  console.log('socket.on onCreated');
  creator = true;
  try {
    userStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    });
    divVideoChatLobby.value.style.display = 'none';
    userVideo.value.srcObject = userStream;
  } catch (err) {
    alert("Couldn't Access User Media");
  }
};

const onJoined = async () => {
  console.log('socket.on onJoined');
  creator = false;
  try {
    userStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    divVideoChatLobby.value.style.display = 'none';
    userVideo.value.srcObject = userStream;
    await fetch('/api/ready', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    });
  } catch (err) {
    alert("Couldn't Access User Media");
  }
};

const onIceCandidateFunction = async (event) => {
  if (event.candidate) {
    await fetch('/api/candidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ candidate: event.candidate, roomName }),
    });
  }
};

const onTrackFunction = (event) => {
  peerVideo.value.srcObject = event.streams[0];
};

const handleOffer = async (offer) => {
  console.log('socket.on offer');
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);
    await fetch('/api/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer, roomName }),
    });
  }
};

const handleAnswer = async (answer) => {
  console.log('socket.on answer');
  await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

const handleCandidate = async (candidate) => {
  console.log('socket.on candidate');
  await rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

const fetchSignalingMessages = async () => {
  console.log("roomName:", roomName)
  if (!roomName) {
    return
  }
  const response = await fetch(`/api/messages?roomName=${roomName}`);
  const messages = await response.json();
  for (const message of messages) {
    if (message.type === 'offer') {
      await handleOffer(message.data);
      continue
    } 
    if (message.type === 'answer') {
      await handleAnswer(message.data);
    } 
    if (message.type === 'candidate') {
      await handleCandidate(message.data);
      continue
    } 
    if (message.type === 'ready') {
      onReady();
      continue
    }
  }
};

const repeatFunc = async (func, time) => {
  const t = time ?? 5000

  if (!func) return
  
  await func()

  setTimeout(() => repeatFunc(func, t), t); 
}

const onReady = async () => {
  console.log('socket.on ready');
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    const offer = await rtcPeerConnection.createOffer();
    await rtcPeerConnection.setLocalDescription(offer);
    await fetch('/api/offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offer, roomName }),
    });
  }
};

onMounted(() => {
  divVideoChatLobby.value = document.getElementById('video-chat-lobby');
  userVideo.value = document.getElementById('user-video');
  peerVideo.value = document.getElementById('peer-video');
  roomInput.value = document.getElementById('roomName');
  repeatFunc(fetchSignalingMessages, 1000)
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
