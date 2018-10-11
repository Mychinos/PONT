
window.socket.on('HelloRoute', (msg) => {
  console.log(msg)
  console.log('Said Hi back for you!')
  socket.emit('HelloServer', '<RoutClientSaz> Hello Server!')
})


window.onload = () => {
  console.log('Hello Route99 Script')
}