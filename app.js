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
const sockets = {}
io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected!`)
  sockets[socket.id] = socket
  socket.on('matchmaking', () => {
    queue.push(socket.id);
    console.log(queue)
    if (queue.length >= 2) {
      // Remove 2 first players from queue
      const p1sid = queue.shift()
      const p2sid = queue.shift()
      console.log(`Game ${p1sid} vs ${p2sid} starts`)
      // Make both player joins each other room
      sockets[p2sid].join(p1sid)
      sockets[p1sid].join(p2sid)
      io.to(p1sid).to(p2sid).emit('game_starts', {
        "player1": p1sid,
        "player2": p2sid
      })
    }

  })
  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected!`)
    const index = queue.indexOf(socket.id)
    if (index != -1) queue.splice(index, 1)
    delete sockets[socket.id]
  })
  socket.on('ready', () => {
    socket.to(socket.id).emit('other_ready')
  })
  // move = {x: int,y: int}
  // update move on other device
  socket.on('move', (move) => {
    socket.to(socket.id).emit('move', move)
  })
  // place bomb on other device
  socket.on('place_bomb', () => {
    socket.to(socket.id).emit('place_bomb')
  })
})
server.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT} `);
});