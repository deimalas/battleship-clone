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

const activeGames = {};

// basic connectivity and attack logic handling, might have to change this later
// yup definitely will, for some reason one user gets logged in as two. idk how i caused this oops
io.on('connection', (socket) => {

    console.log('New player:', socket.id);

    activeGames[socket.id] = {
        grid: generateGrid(),
        shotsLeft: 25,
        hits: new Set()
    };

    socket.emit('game-state', {
        grid: activeGames[socket.id].grid,
        shotsLeft: activeGames[socket.id].shotsLeft
    });

    socket.on('attack', ({ x, y }) => {
        const game = activeGames[socket.id];
        if (!game) return;

        if (game.hits.has(`${x},${y}`)) {
            socket.emit('attack-result', { result: 'Already shot' });
            return;
        }

        game.hits.add(`${x},${y}`);
        let hitValue = game.grid[y][x];

        let response;
        if (hitValue > 0) {
            const isSunk = !game.grid.some(row => row.includes(hitValue));
            response = { result: isSunk ? 'All ships of this type sunk' : 'Hit', ship: hitValue };
            game.grid[y][x] = -hitValue;
        } else {
            game.grid[y][x] = -10; 
            game.shotsLeft--;
            response = { result: 'Miss', shotsLeft: game.shotsLeft };
        }

        if (game.grid.flat().every(cell => cell <= 0)) {
            response.victory = true;
        }

        socket.emit('attack-result', response);

        socket.emit('game-state', {
            grid: activeGames[socket.id].grid,
            shotsLeft: activeGames[socket.id].shotsLeft
        });
    });

    socket.on('reset-game', () => {
        activeGames[socket.id] = {
            grid: generateGrid(),
            shotsLeft: 25,
            hits: new Set()
        };

        socket.emit('game-state', {
            grid: activeGames[socket.id].grid,
            shotsLeft: activeGames[socket.id].shotsLeft
        });
    });

    socket.on('disconnect', () => {
        console.log(`Player ${socket.id} disconnected`);
        delete activeGames[socket.id];
    });
});

//fixed array that i'm using before i make actual generation code. basically just to see if grid display works the way i envision it
let gameGrid = [];
let shotsLeft = 25;

const ship_sizes = [5, 4, 3, 3, 2, 2, 2, 1, 1, 1]

const generateGrid = () => {
    let grid = Array(10).fill(null).map(() => Array(10).fill(0)); //creates an empty array

    const isValidPlacement = (startX, startY, shipSize, isHorizontal) => {
        for (let i = 0; i < shipSize; i++) {
            let currentX = isHorizontal ? startX + i : startX;
            let currentY = isHorizontal ? startY : startY + i;
            // making sure it's on the grid
            if (currentX >= 10 || currentY >= 10 || grid[currentY][currentX] !== 0) {
                return false;
            }
            // at least 1 square difference (ideally)
            for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    let neighborX = currentX + colOffset;
                    let neighborY = currentY + rowOffset;

                    if (
                        neighborX >= 0 && neighborX < 10 &&
                        neighborY >= 0 && neighborY < 10 &&
                        grid[neighborY][neighborX] !== 0
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const placeShip = (shipSize) => {
        let placedSuccessfully = false;

        while (!placedSuccessfully) {
            let randomX = Math.floor(Math.random() * 10);
            let randomY = Math.floor(Math.random() * 10);
            let isHorizontal = Math.random() > 0.5; // 50/50 for horizontal or vertical placement

            if (isValidPlacement(randomX, randomY, shipSize, isHorizontal)) {
                for (let i = 0; i < shipSize; i++) {
                    let shipX = isHorizontal ? randomX + i : randomX;
                    let shipY = isHorizontal ? randomY : randomY + i;
                    grid[shipY][shipX] = shipSize;
                }
                placedSuccessfully = true;
            }
        }
    };

    ship_sizes.forEach(placeShip);
    return grid;
};


const resetGame = () => {
    shotsLeft = 25;
    gameGrid = generateGrid();
};

resetGame();

app.get('/grid', (req, res) => {
    res.json({ grid: gameGrid });
});

app.post('/reset', (req, res) => {
    resetGame();
    shotsLeft = 25;
    res.json({ message: 'Game reset' });
});

app.get('/', (req, res) => {
    res.send('Battleship server is up');
});

server.listen(5000, () => console.log('Server is up on localhost:5000'));