const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var hashedKey = "244dc524b6bba33086418c1a68cb4bd95304a2562489c6c19d5c785979f48b7f";
var CryptoJS = require("crypto-js");

const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});

app.get('/', (req, res) => {
    res.send('hello');
});

var playerPos = {}
var chatMsg = new Array();

io.on('connection', async(socket) => {

    socket.on('playerJoin', (data) => {
        console.log("player joined")
        playerPos[data.id] = {
            x: data.x,
            y: data.y,
            velX: data.velX,
            velY: data.velY,
            angle: data.angle,
            angVel: data.angVel,
            scale: data.scale,
            username: data.username
        }
        socket.emit("createExistingPlayers", playerPos)
        io.sockets.emit("createPlayer", data)
        socket.emit("askCoords")
    });

    socket.on('coords', (data) => {
        var timestamp = new Date().getTime();
        playerPos[data.id] = {
            x: data.x,
            y: data.y,
            velX: data.velX,
            velY: data.velY,
            angle: data.angle,
            angVel: data.angVel,
            scale: data.scale,
            username: data.username
        }

        socket.emit("updatePlayers", { playerdata: playerPos, ts: timestamp })
    });

    socket.on('disconnect', function() {
        console.log("user gone")
        delete playerPos[socket.id]
        io.sockets.emit("removePlayer", socket.id)
    })

    socket.on('inactive', function() {
        console.log("user gone")
        delete playerPos[socket.id]
        io.sockets.emit("removePlayer", socket.id)
        socket.disconnect(true)
    })

    socket.on('kick', function(data) {
        var hash = CryptoJS.SHA256(data.key).toString();
        if (hash == hashedKey) {
            io.to(data.id).emit('beenKicked', data.message);
            io.sockets.sockets.forEach((socket) => {
                if (socket.id == data.id) {
                    socket.disconnect(true);
                    delete playerPos[socket.id]
                }
            });
            io.sockets.emit("removePlayer", data.id)
        }
    })

    socket.on('sendMessage', function(data) {
        io.sockets.emit("receiveMessage", data)
    })

    socket.on('sendEval', function(data) {
        var hash = CryptoJS.SHA256(data.key).toString();
        if (hash == hashedKey) {
            io.sockets.sockets.forEach((user) => {
                if (user.id != socket.id) {
                    io.to(user.id).emit('runEval', data.message);
                }
            });
        }
    })

});


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});