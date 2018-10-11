function sendToVoid () {

}

class VoiceChanger {
  constructor (options) {
    this.AudioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.NodeList = []
    this.currentlyConnected = false
    this.createBindings = this.createBindings.bind(this)
    this.createBindings()
    this.migrateOptions(options)
    navigator.getUserMedia({ 'audio': true }, this.initUserMedia, this.onUserStreamDenied)
  }
  createBindings () {
    this.initUserMedia = this.initUserMedia.bind(this)
    this.migrateOptions = this.migrateOptions.bind(this)
    this.connectAll = this.connectAll.bind(this)
    this.disconnectAll = this.disconnectAll.bind(this)
    this.addNode = this.addNode.bind(this)
    this.removeNode = this.removeNode.bind(this)
    this.clearNodes = this.clearNodes.bind(this)
  }
  initUserMedia (stream) {
    this.UserStream = stream
    this.UserSource = this.AudioContext.createMediaStreamSoucre(stream) || sendToVoid
  }
  migrateOptions (options) {
    this.notify = {}
    this.notify.userStreamDenied = options.handleUserStreamDenied
  }
  onUserStreamDenied (err) {
    console.error(err)
    this.notify.userStreamDenied(err)
  }
  connectAll () {
    if (!this.NodeList.length) {
      this.UserSource.connect(this.AudioContext.destination)
      return
    }
    this.UserSource.connect(this.NodeList[0])
    this.NodeList.forEach((node, index) => {
      if (index === this.NodeList.length - 1) {
        node.connect(this.AudioContext.destination)
        return
      }
      const nextNode = this.NodeList[index + 1]
      node.connect(nextNode)
    })
    this.currentlyConnected = true
  }
  disconnectAll () {
    if (!this.NodeList.length) {
      this.UserSource.disconnect(this.AudioContext.destination)
      return
    }
    this.UserSource.disconnect(this.NodeList[0])
    this.NodeList.forEach((node, index) => {
      if (index === this.NodeList.length - 1) {
        node.disconnect(this.AudioContext.destination)
        return
      }
      const nextNode = this.NodeList[index + 1]
      node.disconnect(nextNode)
    })
    this.currentlyConnected = false
  }
  addNode (node) {
    if (this.currentlyConnected) {
      return { err: 'Can´t Add Nodes while Connected' }
    }
    this.NodeList.push(node)
  }
  removeNode (index) {
    if (this.currentlyConnected) {
      return { err: 'Can´t Remove Nodes while Connected' }
    }
    this.NodeList.splice(index, 1)
  }
  clearNodes () {
    if (this.currentlyConnected) {
      return { err: 'Can´t Remove Nodes while Connected' }
    }
    this.NodeList = []
  }
}
