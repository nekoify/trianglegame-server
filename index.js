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

io.on('connection', async (socket) => {

    socket.on('playerJoin', (data) => {
        console.log("player joined")
        playerPos[data.id] = {
            x: data.x,
            y: data.y,
            velX: data.velX,
            velY: data.velY,
            angle: data.angle,
            angVel: data.angVel
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
            angVel: data.angVel
        }

        socket.emit("updatePlayers", playerPos)
    });

    socket.on('disconnect', function() {
        console.log("user gone")
        delete playerPos[socket.id]
        io.sockets.emit("removePlayer", socket.id)
    })

});


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});
