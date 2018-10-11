const express = require('express')
const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)
const fs = require('fs-extra')
const { join } = require('path')

const routesPath = join(__dirname, 'routes')
const routes = fs.readdirSync(routesPath)

/***********************************************
 *
 * CONFIGURATION SETUP
 *
 *************************************/

const PORT = 80

/***********************************************
 *
 * Express Config
 *
 *************************************/

app.set('view engine', 'pug')
app.use('/static', express.static('./static'))

/***********************************************
 *
 * Dynamic Route Config
 *
 *************************************/

const specialPaths = {
  index: {
    mountPath: '/'
  },
  route99: {
    requiredScripts: [
      '/static/routes/route99.js'
    ],
    requiredStyles: [
      '/static/routes/route99.css'
    ]
  },
  voices: {
    requiredScripts: [
      '/static/routes/voices.js'
    ]
  },
  battleroyal: {
    requiredScripts: [
      '/static/lib/three.js',
      '/static/lib/tween.min.js',
      '/static/lib/TrackballControls.js',
      '/static/lib/CSS3DRenderer.js',
      '/static/routes/battleroyal.js'
    ],
    requiredStyles: [
      '/static/routes/battleroyal.css'
    ]
  }
}

/***********************************************
 *
 * Dynamic Route Mount
 *
 *************************************/

const finalRoutes = routes.reduce((final, route) => {
  console.log(route)
  const pathOptions = specialPaths[route] || {}
  const baseRoute = pathOptions.mountPath ? pathOptions.mountPath : route
  const mountPath = baseRoute.startsWith('/') ? baseRoute : `/${baseRoute}`
  final[route] = { mountPath, ...pathOptions }
  return final
}, {})

Object.keys(finalRoutes).forEach((route) => {
  const routeOptions = finalRoutes[route]
  app.get(routeOptions.mountPath, (req, res) => {
    const routeTemplatePath = join(routesPath, route, `${route}.pug`)
    const params = req.params || undefined
    const body = req.body || undefined
    const query = req.query || undefined
    res.render(routeTemplatePath, { routeName: route, ...routeOptions, params, body, query, routes: finalRoutes })
  })
})

/***********************************************
 *
 * Dynamic Route SocketFunction Prepare
 *
 *************************************/

const socketManager = routes.map((route) => {
  const socketManagerPath = join(routesPath, route, 'sockets.js')
  if (fs.existsSync(socketManagerPath)) {
    return require(socketManagerPath)
  } return false
}).filter((mod) => Boolean(mod))

/***********************************************
 *
 * Socket Config
 *
 *************************************/

io.on('connection', function (socket) {
  console.log('a user connected')
  socketManager.forEach((routeManager) => {
    routeManager.setup(socket)
  })
})

/***********************************************
 *
 * Server Start
 *
 *************************************/

http.listen(PORT, function () {
  console.log(`listening on *:${PORT}`)
})
