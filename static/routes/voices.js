window.VoiceChanger = {
  AudioContext: new (window.AudioContext || window.webkitAudioContext)()
}
const VC = window.VoiceChanger
VC.NodeIndex = {
  Analyser: VC.AudioContext.createAnalyser(),
  Distortion: VC.AudioContext.createWaveShaper(),
  Gain: VC.AudioContext.createGain(),
  BiquadFilter: VC.AudioContext.createBiquadFilter(),
  Convolver: VC.AudioContext.createConvolver()
}
VC.ActiveNodes = []
VC.NodeIndex.Analyser.minDecibels = -90
VC.NodeIndex.Analyser.maxDecibels = -10
VC.NodeIndex.Analyser.smoothingTimeConstant = 0.85
// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {}
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function (constraints) {
    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject)
    })
  }
}

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes

var voiceSelect = document.getElementById('voice')

// /*
//  ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗    ███████╗███████╗████████╗██╗   ██╗██████╗
// ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
// ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝
// ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
// ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ███████║███████╗   ██║   ╚██████╔╝██║
//  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

// */

var canvas = document.querySelector('.visualizer')
var canvasCtx = canvas.getContext('2d')

var intendedWidth = document.querySelector('.wrapper').clientWidth

canvas.setAttribute('width', intendedWidth)

var visualSelect = document.getElementById('visual')

// grab the mute button to use below

var mute = document.querySelector('.mute')

// distortion curve for the waveshaper, thanks to Kevin Ennis
// http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion

function makeDistortionCurve (amount) {
  var k = typeof amount === 'number' ? amount : 50
  var nSamples = 44100
  var curve = new Float32Array(nSamples)
  var deg = Math.PI / 180
  var i = 0
  var x
  for (; i < nSamples; ++i) {
    x = i * 2 / nSamples - 1
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
  }
  return curve
};

// main block for doing the audio recording

function initialSetup (stream) {
  const NI = VC.NodeIndex
  VC.UserStream = stream
  VC.UserSource = VC.AudioContext.createMediaStreamSource(stream)
  VC.UserSource.connect(NI.Analyser)
  VC.ActiveNodes.push(NI.Distortion, NI.BiquadFilter, NI.Convolver, NI.Gain)
  connectAll(VC.ActiveNodes)
  visualize()
  voiceChange()
}

function connectAll (ActiveNodes) {
  const NI = VC.NodeIndex
  if (!ActiveNodes.length) {
    NI.Analyser.connect(VC.AudioContext.destination)
    return
  }
  NI.Analyser.connect(ActiveNodes[0])
  ActiveNodes.forEach((node, index) => {
    if (ActiveNodes.length + 1 === index) {
      node.connect(VC.AudioContext.destination)
      return
    }
    const nextNode = ActiveNodes[index + 1]
    node.connect(nextNode)
  })
}

function disconnectAll (ActiveNodes) {
  const NI = VC.NodeIndex
  if (!ActiveNodes.length) {
    No
  }
}

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.')
  var constraints = { audio: true }
  navigator.mediaDevices.getUserMedia(constraints)
    .then(initialSetup)
    .catch(function (err) { console.log('The following gUM error occured: ' + err) })
} else {
  console.log('getUserMedia not supported on your browser!')
}

function voiceChange () {
  const NI = VC.NodeIndex
  NI.Distortion.oversample = '4x'
  NI.BiquadFilter.gain.setTargetAtTime(0, VC.AudioContext.currentTime, 0)

  var voiceSetting = voiceSelect.value
  console.log(voiceSetting)
  // when convolver is selected it is connected back into the audio path
  if (voiceSetting === 'convolver') {
    NI.BiquadFilter.disconnect(0)
    NI.BiquadFilter.connect(NI.Convolver)
  } else {
    NI.BiquadFilter.disconnect(0)
    NI.BiquadFilter.connect(NI.Gain)
    if (voiceSetting === 'distortion') {
      NI.Distortion.curve = makeDistortionCurve(400)
    } else if (voiceSetting === 'biquad') {
      NI.BiquadFilter.type = 'lowshelf'
      NI.BiquadFilter.frequency.setTargetAtTime(1000, VC.AudioContext.currentTime, 0)
      NI.BiquadFilter.gain.setTargetAtTime(25, VC.AudioContext.currentTime, 0)
    } else if (voiceSetting === 'off') {
      console.log('Voice settings turned off')
    }
  }
}

// event listeners to change visualize and voice settings

visualSelect.onchange = function () {
  window.cancelAnimationFrame(drawVisual)
  visualize()
}

voiceSelect.onchange = function () {
  voiceChange()
}

mute.onclick = voiceMute

function voiceMute () {
  const NI = VC.NodeIndex
  if (mute.id === '') {
    NI.Gain.gain.setTargetAtTime(0, VC.AudioContext.currentTime, 0)
    mute.id = 'activated'
    mute.innerHTML = 'Unmute'
  } else {
    NI.Gain.gain.setTargetAtTime(1, VC.AudioContext.currentTime, 0)
    mute.id = ''
    mute.innerHTML = 'Mute'
  }
}

var drawVisual
function visualize () {
  const WIDTH = canvas.width
  const HEIGHT = canvas.height
  const NI = VC.NodeIndex
  var visualSetting = visualSelect.value
  console.log(visualSetting)

  if (visualSetting === 'sinewave') {
    NI.Analyser.fftSize = 2048
    var bufferLength = NI.Analyser.fftSize
    console.log(bufferLength)
    var dataArray = new Uint8Array(bufferLength)

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    var draw = function () {
      drawVisual = window.requestAnimationFrame(draw)

      NI.Analyser.getByteTimeDomainData(dataArray)

      canvasCtx.fillStyle = 'rgb(200, 200, 200)'
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)'

      canvasCtx.beginPath()

      var sliceWidth = WIDTH * 1.0 / bufferLength
      var x = 0

      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0
        var y = v * HEIGHT / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }

    draw()
  } else if (visualSetting === 'frequencybars') {
    NI.Analyser.fftSize = 256
    var bufferLengthAlt = NI.Analyser.frequencyBinCount
    console.log(bufferLengthAlt)
    var dataArrayAlt = new Uint8Array(bufferLengthAlt)

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    var drawAlt = function () {
      drawVisual = window.requestAnimationFrame(drawAlt)

      NI.Analyser.getByteFrequencyData(dataArrayAlt)

      canvasCtx.fillStyle = 'rgb(0, 0, 0)'
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

      var barWidth = (WIDTH / bufferLengthAlt) * 2.5
      var barHeight
      var x = 0

      for (var i = 0; i < bufferLengthAlt; i++) {
        barHeight = dataArrayAlt[i]

        canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)'
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2)

        x += barWidth + 1
      }
    }

    drawAlt()
  } else if (visualSetting === 'off') {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
    canvasCtx.fillStyle = 'red'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)
  }
}

function handleDistortionOversample (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.Distortion.oversample = value
}
function handleGainChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  console.log(value)
  NI.Gain.gain.setTargetAtTime(value, VC.AudioContext.currentTime, 0)
}
function handleBiquadFilterTypeChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.BiquadFilter.type = value
}
function handleBiquadGainChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.BiquadFilter.gain.setTargetAtTime(value, VC.AudioContext.currentTime, 0)
}
function handleBiquadFreqencyChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.BiquadFilter.frequency.value = value
}
function handleBiquadDetuneChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.BiquadFilter.detune.value = value
}
function handleBiquadQChange (e) {
  const NI = VC.NodeIndex
  const value = e.currentTarget.value
  NI.BiquadFilter.Q.value = value
}
window.onload = function onload () {
  document.getElementById('oversample').addEventListener('change', handleDistortionOversample)
  document.getElementById('gain').addEventListener('change', handleGainChange)
  document.getElementById('filterType').addEventListener('change', handleBiquadFilterTypeChange)
  document.getElementById('biquadGain').addEventListener('change', handleBiquadGainChange)
  document.getElementById('biquadFreqency').addEventListener('change', handleBiquadFreqencyChange)
  document.getElementById('biquadDetune').addEventListener('change', handleBiquadDetuneChange)
  document.getElementById('biquadQ').addEventListener('change', handleBiquadQChange)
}
