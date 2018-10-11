
const dataSet = require('./dataSets/lists.json')
const setup = (socket) => {
  socket.on('getDataSet', (cb) => {
    return cb(dataSet.characters)
  })
}

module.exports = {
  setup
}