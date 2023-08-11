const socket = io("http://localhost:4000");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");

const connectedPeers = {};

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectNewUser = (userId, stream) => {
  const call = myPeer.call(userId, stream);

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  connectedPeers[userId] = call;
};

socket.on("user-disconnected", (userId) => {
  console.log("disconnected", userId);
  if (connectedPeers[userId]) connectedPeers[userId].close();
});

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        connsole.log("user video stream");
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("userConnected", userId);
      connectNewUser(userId, stream);
    });
  });

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
