const socket = io("http://localhost:4000");
const videoGrid = document.getElementById("video-grid");
const shareScreen = document.getElementById("share-screen");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");

const connectedPeers = {};

myPeer.on("open", (id) => {
  user_Id = id;
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

shareScreen.addEventListener("click", async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    addVideoStream(screenStream, myVideo);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        console.log("user video stream");
      });
    });
  } catch (error) {
    console.error("Error sharing screen:", error);
  }
});

// navigator.mediaDevices
//   .getUserMedia({
//     video: false,
//     audio: true,
//   })
//   .then((stream) => {
//     addVideoStream(myVideo, stream);

//     myPeer.on("call", (call) => {
//       call.answer(stream);
//       const video = document.createElement("video");
//       call.on("stream", (userVideoStream) => {
//         addVideoStream(video, userVideoStream);
//         console.log("user video stream");
//       });
//     });

//     socket.on("user-connected", (userId) => {
//       console.log("userConnected", userId);
//       connectNewUser(userId, stream);
//     });
//   });

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
