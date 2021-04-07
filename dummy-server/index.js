const server = require('http').createServer()
const io = require('socket.io')(server, {
  cors: {
    origin: "*"
  }
});

console.log('Socket-io server running on 8080.');
console.log('Emit to "message" or "alice" for debugging.');

let count = 0;

io.on('connection', function (socket) {
  count += 1;
  console.log('Nummber connection: ', count);
  socket.emit('hello', 'welcome');

  socket.on('alice', function (data) {
    console.log('type: ', typeof (data), ' \ndata: ', data, '\n');
    socket.emit('bob', data);
  });
  
  socket.on('message', (data) => {
    console.log('message: ', data);
  });

  socket.on('disconnect', () => {
    count -= 1;
    console.log('Nummber connection: ', count);
  });
});

server.listen(8080);