const socket = io("http://localhost:4000");
const videoGrid = document.getElementById("video-grid");
const shareBtn = document.getElementById("share-btn");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");

const connectedPeers = {};
var currentPeer = null;
let myVideoStream;
var peerList = [];

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectNewUser = (userId, stream) => {
  const call = myPeer.call(userId, stream);
  currentPeer = call;

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("userVideoStream", userVideoStream);
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  connectedPeers[userId] = call;
};

let getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    window.stream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      currentPeer = call;

      call.on("stream", (userVideoStream) => {
        console.log("user video stream");

        if (!peerList.includes(call.peer)) {
          addVideoStream(video, userVideoStream);
          peerList.push(call.peer);
        }
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("userConnected", userId);
      connectNewUser(userId, stream);
    });

    socket.on("user-disconnected", (userId) => {
      console.log("disconnected", userId);
      if (connectedPeers[userId]) connectedPeers[userId].close();
    });

    shareBtn.addEventListener("click", (e) => {
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        .then((stream) => {
          const screenStream = stream;
          window.stream = stream;

          let videoTrack = screenStream.getVideoTracks()[0];

          if (myPeer) {
            console.log("Current Peer", currentPeer);
            const video = document.createElement("video");
            addVideoStream(video, stream);

            let sender = currentPeer.peerConnection
              .getSenders()
              .find(function (s) {
                return s.track.kind == videoTrack.kind;
              });
            sender.replaceTrack(videoTrack);
            screenSharing = true;
          }
        })
        .catch((err) => {
          console.log("unable to get display media" + err);
        });
    });
  });

myPeer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      currentPeer = call;
      call.answer(stream); // Answer the call with stream.
      console.log("Init window stream with stream");
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        if (!peerList.includes(call.peer)) {
          addVideoStream(video, remoteStream);
          peerList.push(call.peer);
        }
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
