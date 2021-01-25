const express = require('express')
const app = express();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send({
    'message': 'Hello World'
  })
});

const queue = []
io.on('connection', (socket) => {
  socket.on('matchmaking', () => {
    queue.push(socket);
    if (queue.length >= 2) {
      // Remove 2 first players from queue
      const p1 = queue.shift()
      const p2 = queue.shift()
      // Make both player joins each other room
      p1.join(p2.id)
      p2.join(p1.id)
      // Start game on both Pi with initial position
      p1.broadcast.emit('start_game', { x1: 0, y1: 0, x2: 7, y2: 7 })
      p2.broadcast.emit('start_game', { x1: 7, y1: 7, x2: 0, y2: 0 })
    }
  })
  socket.on('disconnect', () => {
    const index = queue.indexOf(socket)
    if (index != -1) queue.splice(index, 1)
  })
  socket.on('move', (move) => {
    socket.broadcast.to(socket.id).emit('move', move)
  })
  socket.on('place_bomb', () => {
    socket.broadcast.to(socket.id).emit('place_bomb')
  })
})
server.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT} `);
});