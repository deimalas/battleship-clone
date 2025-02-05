import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);
  const [grid, setGrid] = useState([]);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    socket.on('game-state', (data) => {
      setGrid(data.grid);
      setShotsLeft(data.shotsLeft);
    });
    socket.on('attack-result', (data) => {
      setMessages((prev) => [...prev, data.result]);
      if (data.result === 'Miss' || data.result === 'Hit') 
      setShotsLeft(data.shotsLeft);
      if (data.victory) 
      setMessages((prev) => [...prev, 'Victory, all ships sunk']);
    });

      return () => socket.off('game-state').off('attack-result');
    }, []);

    const handleAttack = () => {
      if (!selectedCell) return;
      socket.emit('attack', selectedCell);
    }

    const handleReset = () => {
      socket.emit('reset-game');
      setMessages([]);
      };

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
                                cell === -10 ? 'blue' : // miss
                                cell < 0 ? 'darkred' : // hit ship
                                cell > 0 ? 'gray' : // ship (for testing)
                                'white' // watuh
                        }}
                    ></div>
                ))
            )}
        </div>
        <button onClick={handleAttack}>Attack</button>
        <button onClick={handleReset} style={{ marginLeft: '10px' }}>Reset Board</button>
        <ul>
            {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
            ))}
        </ul>
    </div>
);
}

export default App;