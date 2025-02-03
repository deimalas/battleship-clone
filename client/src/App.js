import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);
  const [grid, setGrid] = useState([]);

  // for now using socket.on and socket.off to turn off listeners and go about the double send. probably as clean as it gets??? idk how else
  // basically a filler method before making it actually functional
  useEffect(() => {
    const handleAttackResult = (data) => {
        setMessages((prev) => [...prev, data]);
    };

    socket.on('attack-result', handleAttackResult);

    return () => {
        socket.off('attack-result', handleAttackResult);
    };
  }, []);
    // literally just sends the message for now, very preliminary
  const handleAttack = () => {
    socket.emit('attack', { message: 'Player is attacking' });
  };

  useEffect(() => {
    fetch('http://localhost:5000/grid')
        .then(res => res.json())
        .then(data => setGrid(data.grid));
  }, []);

  // sparse html page just to see that network connectivity works
  // added the grid display, so far no onclick or anything, also unhidden, it just shows which parts of the array are filled to prove that display is possible
  // and yes the CSS is all inline for now bc i wanna get this functional
  return (
    <div>
      <h1>Battleship Clone</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 20px)', gap: '0px' }}>
                {grid.flat().map((cell, index) => (
                    <div key={index} style={{ width: 20, height: 20, border: '1px solid black',
                                              backgroundColor: cell ? 'blue' : 'white'
                                            }}> 
                    </div>
                ))}
      </div>
      <button onClick={handleAttack}>Attack</button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg.message}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;