import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('attack-result', (data) => {
      setMessages((prev) => [...prev, data]);
    });
  }, []);
    // literally just sends the message for now, very preliminary
  const handleAttack = () => {
    socket.emit('attack', { message: 'Player is attacking' });
  };
  // sparse html page just to see that network connectivity works
  return (
    <div>
      <h1>Battleship Clone</h1>
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