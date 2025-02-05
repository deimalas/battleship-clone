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

// socket.io used for handling the event logic, to allow for multiple users at once to play
io.on('connection', (socket) => {

    console.log('New player:', socket.id);

    // creates a new game for new user based on socket.id, keeps its state
    // the hits set wasn't strictly necessary, other workarounds exist, however this was the easiest to avoid double hits
    activeGames[socket.id] = {
        grid: generateGrid(),
        shotsLeft: 25,
        hits: new Set()
    };

    // game state update, initial load
    socket.emit('game-state', {
        grid: activeGames[socket.id].grid,
        shotsLeft: activeGames[socket.id].shotsLeft
    });

    // attack handling
    socket.on('attack', ({ x, y }) => {
        const game = activeGames[socket.id];
        if (!game)  // if game doesn't exist, quits, very edge case
            return;

        if (game.hits.has(`${x},${y}`)) {
            socket.emit('attack-result', { result: 'Already shot' });
            return; // checking if coordinate has already been shot at
        }
        // adds shot coordinate to set, also takes the hitvalue for hitcheck
        game.hits.add(`${x},${y}`);
        let hitValue = game.grid[y][x];

        let response;
        if (hitValue > 0) {
            const isSunk = !game.grid.some(row => row.includes(hitValue)); // if game grid doesn't have this value anymore, it will count the ship as sunk
            response = { result: isSunk ? 'All ships of this type sunk' : 'Hit', ship: hitValue };
            game.grid[y][x] = -hitValue; // inverting the value for tracking of hit and sunk ships
        } else {
            game.grid[y][x] = -10; // if water is hit, value set to -10
            game.shotsLeft--; // shot--
            response = { result: 'Miss', shotsLeft: game.shotsLeft };
        }

        if (game.grid.flat().every(cell => cell <= 0)) {
            response.victory = true; // if every cell is 0 or less, game is won
        }

        socket.emit('attack-result', response);
        // updating the game state again at end of attack
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
    // upon disconnect player is removed
    socket.on('disconnect', () => {
        console.log(`Player ${socket.id} disconnected`);
        delete activeGames[socket.id];
    });
});


let gameGrid = [];
let shotsLeft = 25;

const ship_sizes = [5, 4, 3, 3, 2, 2, 2, 1, 1, 1] // this is scalable if for some reason that is desired

// method for generating a brand new grid every time reset is hit, from testing it has been correct
// works assuming it's a 10x10 array, fills it with empty (0)
// then working from there it checks if the placement is correct via offsets
// finally the placeship method tries until it finds a correct ship placement
// the grid is coded by size of ship, so a 5 blocks large ship is 5 5 5 5 5, 2 blocks large is 2 2, etc.
const generateGrid = () => {
    let grid = Array(10).fill(null).map(() => Array(10).fill(0)); // creates an empty array

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