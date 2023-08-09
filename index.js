const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();
const Server = require("http").Server(app);
const io = require("socket.io")(Server);

app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

Server.listen(4000, () => console.log("Server is Listening on Port 4000"));
