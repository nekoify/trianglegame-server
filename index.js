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
    res.send('server');
});

var playerPos = {}

io.on('connection', async(socket) => {

    socket.on('playerJoin', (data) => {
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
        try {
            io.sockets.emit("receiveMessage", { username: data.username, type: "left", message: { time: 100 } })
            io.sockets.emit("removePlayer", { id: socket.id, username: playerPos[socket.id].username })
            delete playerPos[socket.id]
        } catch (error) {
            console.log(error)
        }
    })

    socket.on('inactive', function(data) {
        io.sockets.emit("removePlayer", { id: socket.id, username: data })
        delete playerPos[socket.id]
        socket.disconnect(true)
    })

    socket.on('kick', function(data) {
        var hash = CryptoJS.SHA256(data.key).toString();
        if (hash == hashedKey) {
            io.to(data.id).emit('beenKicked', data.message);
            io.sockets.sockets.forEach((socket) => {
                if (socket.id == data.id) {
                    io.sockets.emit("removePlayer", { id: socket.id, username: playerPos[socket.id].username })
                    socket.disconnect(true);
                    delete playerPos[socket.id]
                }
            });
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
                    io.to(user.id).emit('runEval', { message: data.message, id: data.id, username: data.username });
                }
            });
        }
    })

});

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
})
