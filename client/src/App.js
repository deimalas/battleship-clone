import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);
  const [grid, setGrid] = useState([]);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [selectedCell, setSelectedCell] = useState(null);

  // handling of event logic, initial game state update alongside attack and reset
  useEffect(() => {
    socket.on('game-state', (data) => {
      setGrid(data.grid);
      setShotsLeft(data.shotsLeft);
    });
    socket.on('attack-result', (data) => {
      setMessages((prev) => [...prev, data.result]);
      if (data.result === 'Miss' || data.result === 'Hit') // updating upon user input
      setShotsLeft(data.shotsLeft);
      if (data.victory) 
      setMessages((prev) => [...prev, 'Victory, all ships sunk']);
    });

      return () => socket.off('game-state').off('attack-result'); // listening off the socket to prevent double updates
    }, []);

    const handleAttack = () => {
      if (!selectedCell) 
        return;
      socket.emit('attack', selectedCell);
    }

    const handleReset = () => {
      socket.emit('reset-game');
      setMessages([]);
      };

  // not the prettiest HTML however it looks good enough
  return (
    <div>
        <h1>Battleship Clone</h1>
        <h2>Shots: {shotsLeft}</h2>
        <div className="grid">
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => setSelectedCell({ x, y })}
              className={
                selectedCell?.x === x && selectedCell?.y === y
                  ? 'selected'
                  : cell === -10
                  ? 'miss'
                  : cell < 0
                  ? 'hit'
                  : cell > 0
                  ? 'ship'
                  : ''
              }
            ></div>
                ))
            )}
        </div>
        <button onClick={handleAttack}>Attack</button>
        <button onClick={handleReset} style={{ marginLeft: '10px' }}>Reset Board</button>
        <ul>
            {messages.map((msg, index) => (
                <li key={index}>{msg}</li> // messages display (it does just scroll all the way downnnnnnnnn but whatever)
            ))}
        </ul>
    </div>
);
}

export default App;