import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App(){
  const [messages, setMessages] = useState([]);

  // for now using socket.on and socket.off to turn off listeners and go about the double send. probably as clean as it gets??? idk how else
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