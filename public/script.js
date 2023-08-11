const socket = io("http://localhost:4000");
const videoGrid = document.getElementById("video-grid");
const shareScreen = document.getElementById("share-screen");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");

const connectedPeers = {};
let user_Id;
let screenStream = null;

myPeer.on("open", (id) => {
  user_Id = id;
  socket.emit("join-room", ROOM_ID, id);
});

const connectNewUser = (userId, userStream, screenStream) => {
  const call = myPeer.call(userId, screenStream);
  const video = document.createElement("video");

  call.on("stream", (userScreenStream) => {
    addVideoStream(video, userScreenStream);
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

shareScreen.addEventListener("click", async () => {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    addVideoStream(myVideo, screenStream);

    myPeer.on("call", (call) => {
      call.answer(screenStream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        console.log("user video stream");
      });
    });

    socket.emit("screen-sharing", user_Id);
  } catch (error) {
    console.error("Error sharing screen:", error);
  }
});

socket.on("user-connected", (userId) => {
  console.log("userConnected", userId);
  // connectNewUser(userId, stream);
});

socket.on("screen-sharing", (userId) => {
  console.log("User is sharing screen:", userId);
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((userStream) => {
      // const screenStream = getScreenSharingStream();
      console.log(userStream.getAudioTracks());
      connectNewUser(userId, userStream, screenStream);
    })
    .catch((error) => {
      console.error("Error accessing media devices:", error);
    });
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);

  // if (stream.getVideoTracks().length > 0) {
  //   videoGrid.append(video);
  // } else {
  //   const screenVideoContainer = document.getElementById("screen-video");
  //   screenVideoContainer.srcObject = stream;
  //   screenVideoContainer.addEventListener("loadedmetadata", () => {
  //     screenVideoContainer.play();

  //     screenVideoContainer.appendChild(video);
  //   });
  // }
}

// function shareScreenStream(screenStream, user_Id) {
//   const call = myPeer.call(user_Id, screenStream);

//   const screenVideo = document.createElement("video");
//   call.on("stream", (userScreenStream) => {
//     addVideoStream(screenVideo, userScreenStream);
//   });

//   call.on("close", () => {
//     screenVideo.remove();
//   });

//   connectedPeers[user_Id] = call;
// }
