const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});

app.get('/', (req, res) => {
    res.send('hello');
});

var playerPos = {}

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

        socket.emit("updatePlayers", playerPos)
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
    socket.on('inactive', function() {
        console.log("user gone")
        delete playerPos[socket.id]
        io.sockets.emit("removePlayer", socket.id)
        socket.disconnect(true)
    })

    socket.on('kick', function(data) {
        io.to(data.id).emit('beenKicked', data.message);
        io.sockets.sockets.forEach((socket) => {
            if (socket.id === data.id) {
                socket.disconnect(true);
            }
        });
        io.sockets.emit("removePlayer", data.id)
    })

});


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});