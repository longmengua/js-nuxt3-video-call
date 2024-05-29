import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot, ssrRenderStyle } from 'vue/server-renderer';
import { useSSRContext, withCtx, createTextVNode, ref } from 'vue';
import { _ as _export_sfc, a as useRuntimeConfig } from './server.mjs';
import { io } from 'socket.io-client';
import '../runtime.mjs';
import 'node:http';
import 'node:https';
import 'events';
import 'https';
import 'http';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'url';
import 'zlib';
import 'buffer';
import 'fs';
import 'path';
import 'engine.io';
import 'socket.io';
import 'node:fs';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';

const _sfc_main$2 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<span${ssrRenderAttrs(_attrs)}>`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</span>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppAlert.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$1 = {
  __name: "JoinRoomOverSocket",
  __ssrInlineRender: true,
  setup(__props) {
    const config = useRuntimeConfig();
    const socketUrl = config.public.SOCKET_URL;
    const socket = io.connect(socketUrl);
    const divVideoChatLobby = ref(null);
    const userVideo = ref(null);
    const peerVideo = ref(null);
    ref(null);
    let roomName;
    let creator = false;
    let rtcPeerConnection;
    let userStream;
    const iceServers = {
      iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" }
      ]
    };
    const OnIceCandidateFunction = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
      }
    };
    const OnTrackFunction = (event) => {
      peerVideo.value.srcObject = event.streams[0];
      peerVideo.value.onloadedmetadata = function(e) {
        peerVideo.value.play();
      };
    };
    socket.on("created", () => {
      console.log("socket.on created");
      creator = true;
      (void 0).mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 }
      }).then((stream) => {
        userStream = stream;
        divVideoChatLobby.value.style = "display:none";
        userVideo.value.srcObject = stream;
        userVideo.value.onloadedmetadata = function(e) {
          userVideo.value.play();
        };
      }).catch((err) => {
        alert("Couldn't Access User Media");
      });
    });
    socket.on("joined", () => {
      console.log("socket.on joined");
      creator = false;
      (void 0).mediaDevices.getUserMedia({
        audio: true,
        video: true
      }).then((stream) => {
        userStream = stream;
        divVideoChatLobby.value.style = "display:none";
        userVideo.value.srcObject = stream;
        userVideo.value.onloadedmetadata = function(e) {
          userVideo.value.play();
        };
        socket.emit("ready", roomName);
      }).catch((err) => {
        alert("Couldn't Access User Media");
      });
    });
    socket.on("full", () => {
      console.log("socket.on full");
      alert("Room is Full, Can't Join");
    });
    socket.on("ready", () => {
      console.log("socket.on ready");
      if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer().then((offer) => {
          rtcPeerConnection.setLocalDescription(offer);
          socket.emit("offer", offer, roomName);
        }).catch((error) => {
          console.log(error);
        });
      }
    });
    socket.on("candidate", (candidate) => {
      console.log("socket.on candidate");
      const icecandidate = new RTCIceCandidate(candidate);
      rtcPeerConnection.addIceCandidate(icecandidate);
    });
    socket.on("offer", (offer) => {
      console.log("socket.on offer");
      if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer().then((answer) => {
          rtcPeerConnection.setLocalDescription(answer);
          socket.emit("answer", answer, roomName);
        }).catch((error) => {
          console.log(error);
        });
      }
    });
    socket.on("answer", (answer) => {
      console.log("socket.on answer");
      rtcPeerConnection.setRemoteDescription(answer);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-e766fd61>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`<div id="video-chat-lobby" data-v-e766fd61><h2 class="text" data-v-e766fd61>Video Chat Application</h2><input id="roomName" type="text" placeholder="Room Name" data-v-e766fd61><button id="join" data-v-e766fd61>Join</button></div><div id="video-chat-room" data-v-e766fd61><video id="user-video" autoplay muted playsinline style="${ssrRenderStyle({ "width": "320px", "height": "240px" })}" data-v-e766fd61></video><video id="peer-video" autoplay playsinline style="${ssrRenderStyle({ "width": "320px", "height": "240px" })}" data-v-e766fd61></video></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/JoinRoomOverSocket.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-e766fd61"]]);
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_AppAlert = __nuxt_component_0;
  const _component_JoinRoomOverSocket = __nuxt_component_1;
  _push(`<div${ssrRenderAttrs(_attrs)}><h1>Welcome to the homepage</h1>`);
  _push(ssrRenderComponent(_component_AppAlert, null, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` This is an auto-imported component `);
      } else {
        return [
          createTextVNode(" This is an auto-imported component ")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_JoinRoomOverSocket, null, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Join Room over websocket`);
      } else {
        return [
          createTextVNode("Join Room over websocket")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { index as default };
//# sourceMappingURL=index-Bb0e0b8q.mjs.map
