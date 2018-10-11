

const setup = (socket) => {
  socket.on('HelloServer', (msg) => {
    console.log(msg)
  })
  socket.emit('HelloRoute', '<SocketSez> Hello Route 99 Client')
}

module.exports = {
  setup
}