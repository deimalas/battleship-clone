const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// basic connectivity and attack logic handling, might have to change this later
// yup definitely will, for some reason one user gets logged in as two. idk how i caused this oops
io.on('connection', (socket) => {

    console.log('New player:', socket.id);

    socket.on('attack', (data) => {
        io.emit('attack-result', data);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected');
    });
});

app.get('/', (req, res) => {
    res.send('Battleship server is up');
});

server.listen(5000, () => console.log('Server is up on localhost:5000'));