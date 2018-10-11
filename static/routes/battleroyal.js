let dataset = []
var camera, scene, renderer
var controls
var currentTween = null
function createChemicalElementHtml (object) {
  var element = document.createElement('div')
  element.className = 'element'
  element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')'
  var number = document.createElement('div')
  number.className = 'number'
  number.textContent = object.weight
  element.appendChild(number)

  var symbol = document.createElement('div')
  symbol.className = 'symbol'
  symbol.textContent = object.shortName
  element.appendChild(symbol)
  var details = document.createElement('div')
  details.className = 'details'
  details.innerHTML = object.longName + '<br>' + object.weight
  element.appendChild(details)
  return element
}

function createCharacterHtml (object) {
  var element = document.createElement('div')
  element.className = 'element character'
  element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')'

  const image = document.createElement('img')
  image.src = object.imgSrc
  image.className = 'image'
  element.appendChild(image)

  var details = document.createElement('div')
  const nickname = object.nickName ? `"${object.nickName}"` : ''
  details.className = 'details'
  details.innerHTML = `${object.firstName} ${nickname} ${object.lastName}`
  element.appendChild(details)
  return element
}

function createElementHtml (object) {
  // Get Html for Object Type
  switch (object.type) {
    case 'chemical':
      return createChemicalElementHtml(object)
    case 'character':
      return createCharacterHtml(object)
    case 'place':
      return createPlaceHtml(object)
    case 'fraction':
      return createFractionHtml(object)
  }
}

function showChemicalWindowFor (chem) {

}

function showCharacterWindowFor (char) {
  const container = document.getElementById('character')
  container.classList.remove('hidden')
}

function closeWindow (id) {
  document.getElementById(id).classList.add('hidden')
  closeElement(window.elementOpen)
}

function openElementWindow (data) {
  switch (data.type) {
    case 'chemical':
      return showChemicalWindowFor(data)
    case 'character':
      return showCharacterWindowFor(data)
  }
}
function openErrorWindow (err) {

}
function openElement (e) {
  if (currentTween) {
    return
  }
  const element = e.currentTarget
  const object = element.parent
  window.elementOpen = { currentTarget: e.currentTarget }
  const id = element.id
  controls.enabled = false
  element.removeEventListener('click', openElement)
  element.addEventListener('click', closeElement)
  currentTween = new TWEEN.Tween(object.position, { override: true })
    .to({ x: camera.position.x, y: camera.position.y, z: camera.position.z - 500 }, Math.random() * 2000 + 2000)
    .easing(TWEEN.Easing.Exponential.InOut)
    .onComplete(() => {
      object.element.classList.add('loading')
      socket.emit('getElement', id, (err, data) => {
        console.log(err, data)
        if (err) {
          return openErrorWindow(err)
        }
        return openElementWindow(data)
      })
    })
    .start()
  if (!window.RenderLoopActive) {
    startTweenRenderLoop()
  }
}

function closeElement (e) {
  if (!currentTween) {
    return
  }
  window.elementOpen = false
  const element = e.currentTarget
  const object = element.parent
  element.removeEventListener('click', closeElement)
  element.addEventListener('click', openElement)
  const target = window.positionTargets[window.currenTarget][object.currentViewIndex]
  currentTween = new TWEEN.Tween(object.position, { override: true })
    .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * 2000 + 2000)
    .easing(TWEEN.Easing.Exponential.InOut)
    .onComplete(() => {
      currentTween = false
      controls.enabled = true
    })
    .start()

  if (!window.RenderLoopActive) {
    startTweenRenderLoop()
  }
}

function createElementCss3D (htmlElement) {
  // construct Css3dObject
  console.log(htmlElement)
  var object = new THREE.CSS3DObject(htmlElement)
  
  // Hack to get Css3dObject for OnClick Events
  htmlElement.parentElement = object
  htmlElement.parent = object
  // Like So:
  object.element.onclick = openElement
  return object
}

function calculatePositionInTable (item, i) {
  // Creates Shadow object with position only
  // to save Target Position for structure
  const shadowObject = new THREE.Object3D()
  // Definition for Table Grid
  // TODO: Make Dynamic from i
  // Table 18 * 10
  const x = i % 18
  const y = Math.floor(i / 18) + 1
  shadowObject.position.x = (x * 140) - 1330
  shadowObject.position.y = -(y * 180) + 990
  // Push to Structure Object ?
  window.positionTargets.table.push(shadowObject)
}

function calculatePositionOnSphere (item, i, arr) {
  const { vector, spherical } = window.positionUtils.sphere
  const l = arr.length
  var phi = Math.acos(-1 + (2 * i) / l)
  var theta = Math.sqrt(l * Math.PI) * phi

  var object = new THREE.Object3D()

  spherical.set(800, phi, theta)

  object.position.setFromSpherical(spherical)

  vector.copy(object.position).multiplyScalar(2)

  object.lookAt(vector)

  window.positionTargets.sphere.push(object)
}

function calculatePositionOnHelix (item, i) {
  const { vector, cylindrical } = window.positionUtils.helix
  var theta = i * 0.175 + Math.PI
  var y = -(i * 8) + 450

  var object = new THREE.Object3D()

  cylindrical.set(900, theta, y)

  object.position.setFromCylindrical(cylindrical)

  vector.x = object.position.x * 2
  vector.y = object.position.y
  vector.z = object.position.z * 2

  object.lookAt(vector)

  window.positionTargets.helix.push(object)
}

function calculatePositionOnGrid (item, i) {
  var object = new THREE.Object3D()

  object.position.x = ((i % 5) * 400) - 800
  object.position.y = (-(Math.floor(i / 5) % 5) * 400) + 800
  object.position.z = (Math.floor(i / 25)) * 1000 - 2000
  window.positionTargets.grid.push(object)
}

function onSave () {
  console.log('SAVE! TODO: SAVE DATA')
}

function init () {
  // window.modal = window.initializeModal(onSave)
  // console.log(modal)
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.z = 3000
  window.positionUtils = {
    sphere: {
      vector: new THREE.Vector3(),
      spherical: new THREE.Spherical()
    },
    helix: {
      vector: new THREE.Vector3(),
	    cylindrical: new THREE.Cylindrical()
    }
  }
  window.positionTargets = { table: [], sphere: [], helix: [], grid: [] }
  window.currenTarget = 'table'
  window.dataObjects = []

  scene = new THREE.Scene()

  // table
  // For Every Dataelement:
  dataset.forEach((item, i, arr) => {
    // Construct Html of Element
    const element = createElementHtml(item)
    console.log(element)
    const object = createElementCss3D(element)
    // Initial Random Scatter
    object.position.x = Math.random() * 4000 - 2000
    object.position.y = Math.random() * 4000 - 2000
    object.position.z = Math.random() * 4000 - 2000
    object.currentViewIndex = i
    // Add all objects
    scene.add(object)
    // Keep track of Objects
    window.dataObjects.push(object)
    calculatePositionInTable(item, i)
    calculatePositionOnSphere(item, i, arr)
    calculatePositionOnHelix(item, i)
    calculatePositionOnGrid(item, i)
  })

  //
  // Setup Renderer and Mount to Dom
  renderer = new THREE.CSS3DRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.domElement.style.position = 'absolute'
  document.getElementById('container').appendChild(renderer.domElement)

  //
  // Setup Controlls
  controls = new THREE.TrackballControls(camera, renderer.domElement)
  controls.rotateSpeed = 0.5
  controls.minDistance = 500
  controls.maxDistance = 6000
  controls.addEventListener('change', () => {
    if (controls.enabled && !window.RenderLoopActive) {
      render()
    }
  })

  // Button Handler for Restructuring
  var button = document.getElementById('table')
  button.addEventListener('click', function (event) {
    window.currenTarget = 'table'
    transform(window.positionTargets.table, 2000)
  }, false)

  var button = document.getElementById('sphere')
  button.addEventListener('click', function (event) {
    window.currenTarget = 'sphere'
    transform(window.positionTargets.sphere, 2000)
  }, false)

  var button = document.getElementById('helix')
  button.addEventListener('click', function (event) {
    window.currenTarget = 'helix'
    transform(window.positionTargets.helix, 2000)
  }, false)

  var button = document.getElementById('grid')
  button.addEventListener('click', function (event) {
    window.currenTarget = 'grid'
    transform(window.positionTargets.grid, 2000)
  }, false)

  transform(window.positionTargets.table, 2000)

  //

  window.addEventListener('resize', onWindowResize, false)
}

function transform (targets, duration) {
  // Removes all active translations ?
  TWEEN.removeAll()
  	// For every Element, get coordinates for element in target structure
  // And start Translation
  window.dataObjects.forEach((object, i) => {
    var target = targets[i]
    new TWEEN.Tween(object.position)
      .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    new TWEEN.Tween(object.rotation)
      .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
  })

  // Tween nothing somewhere for double of set Timeperiode (Max as to the "Random-Start"" Multiplication)
  // Only used so set the Render Method to onUpdate();
  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)

  render()
}

function animate () {
  requestAnimationFrame(animate)

  TWEEN.update()

  controls.update()
}

function render () {
  renderer.render(scene, camera)
}

function startTweenRenderLoop () {
  if (window.RenderLoopActive) {
    return
  }
  window.RenderLoopActive = true
  renderActiveTweens()
}

function renderActiveTweens () {
  if (!TWEEN.getAll().length) {
    window.RenderLoopActive = false
    return
  }
  setTimeout(renderActiveTweens, 20)
  renderer.render(scene, camera)
}

window.onload = function () {
  const socket = window.socket = window.socket || io()
  socket.emit('getDataSet', (data) => {
    dataset = data
    init()
    animate()
  })
}
