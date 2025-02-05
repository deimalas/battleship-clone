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

// copy for game reset (need to make a regenerate method)
const originalGrid = JSON.parse(JSON.stringify([ // Deep copy for reset
    [0, 0, 0, 0, 5, 5, 5, 5, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 4, 4, 4, 4, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 2, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [2, 2, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]));

//fixed array that i'm using before i make actual generation code. basically just to see if grid display works the way i envision it
let gameGrid = [
    [0, 0, 0, 0, 5, 5, 5, 5, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 4, 4, 4, 4, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 2, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [2, 2, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

let shotsLeft = 25;

app.get('/grid', (req, res) => {
    res.json({ grid: gameGrid });
});

app.post('/reset', (req, res) => {
    gameGrid = JSON.parse(JSON.stringify(originalGrid));
    shotsLeft = 25;
    res.json({ message: 'Game reset' });
});

// shots are counted and hits are hits, however no win condition yet and also double shots are possible. to be refined
const checkShot = (x, y) => {
    const hitValue = gameGrid[y][x];
    const isSunk = false;

    if (hitValue < 0) 
    return { result: 'Already shot, pick another spot' }; // using the fact it's simple coordinates

    if (hitValue > 0) {
        gameGrid[y][x] = -hitValue; // if it's hit, invert the value, since grid is coded by ship lengths
        
        if (hitValue >= 3)
        isSunk = !gameGrid.some(row => row.includes(hitValue));
        
        if (hitValue = 1)
        isSunk = true;

        const allShipsSunk = !gameGrid.flat().some(cell => cell > 0);
        if (allShipsSunk) return { result: 'Victory' }

        return { result: isSunk ? 'Sunk' : 'Hit', ship: hitValue };
    } else {
        gameGrid[y][x] = -10;
        shotsLeft--;
        return { result: 'Miss' };
    }
};

app.post('/attack', (req, res) => {
    if (shotsLeft <= 0) 
    return res.json({ message: 'No shots left', shotsLeft });

    const { x, y } = req.body;
    const attackResult = checkShot(x, y);

    res.json({ ...attackResult, shotsLeft });
});


app.get('/', (req, res) => {
    res.send('Battleship server is up');
});

server.listen(5000, () => console.log('Server is up on localhost:5000'));