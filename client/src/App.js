import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);
  const [grid, setGrid] = useState([]);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [selectedCell, setSelectedCell] = useState(null);

  // for now using socket.on and socket.off to turn off listeners and go about the double send. probably as clean as it gets??? idk how else
  // basically a filler method before making it actually functional

  const handleAttack = () => {
    if (!selectedCell) return;

    fetch('http://localhost:5000/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCell)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            setMessages((prev) => [...prev, data.message]);
        } else {
            setMessages((prev) => [...prev, data.result]);
            if (data.result === 'miss') setShotsLeft(data.shotsLeft);
        }

        fetch('http://localhost:5000/grid')
            .then(res => res.json())
            .then(data => setGrid(data.grid));
    })
    .catch(error => console.error("Error parsing JSON:", error));
    };


  useEffect(() => {
    fetch('http://localhost:5000/grid')
        .then(res => res.json())
        .then(data => setGrid(data.grid));
  }, []);

  // sparse html page just to see that network connectivity works
  // added the grid display, also onclick, game logic be there wahoo
  // and yes the CSS is all inline for now bc i wanna get this functional
  return (
    <div>
        <h1>Battleship Clone</h1>
        <h2>Shots: {shotsLeft}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 20px)' }}>
            {grid.map((row, y) => 
                row.map((cell, x) => (
                    <div 
                        key={`${x}-${y}`} 
                        onClick={() => setSelectedCell({ x, y })}
                        style={{
                            width: 20, height: 20, border: '1px solid black',
                            backgroundColor:
                                selectedCell?.x === x && selectedCell?.y === y ? 'red' :
                                cell < 0 ? 'darkred' : // hit ship
                                cell > 0 ? 'gray' : // ship (for testing)
                                'blue' // watuh
                        }}
                    ></div>
                ))
            )}
        </div>
        <button onClick={handleAttack}>Attack</button>
        <ul>
            {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
            ))}
        </ul>
    </div>
);
}

export default App;