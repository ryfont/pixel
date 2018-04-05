import m from 'mithril'
import {fabric} from 'fabric'
import ImageSelector from '../components/image_selector'

const COLORS = {
  RED: 'rgba(211, 49, 89, 0.9)',
  BLUE: 'rgba(49, 135, 211, 0.9)',
  RED_FULL: 'rgba(211, 49, 89, 1)',
  BLUE_FULL: 'rgba(49, 135, 211, 1)',
  RED_FADED: 'rgba(211, 49, 89, 0.2)',
  BLUE_FADED: 'rgba(49, 135, 211, 0.2)'
}

const PIXEL_WIDTH = 19

function updateLoupe (vnode, pos) {
  if (vnode.state.tool !== 'pixel') {
    return
  }
  if (pos === undefined) {
    pos = vnode.state.mousePos
  }

  vnode.state.mousePos = pos
  let loupe = document.getElementById('loupe')
  if (pos === null) {
    loupe.style.display = 'none'
  } else {
    loupe.style.display = 'block'
    loupe.style.position = 'absolute'
    loupe.style.left = `${pos.x - (PIXEL_WIDTH*.5) + 0.5}px`
    loupe.style.top = `${pos.y + PIXEL_WIDTH}px`
    loupe.style.backgroundColor = pixelColor(vnode, pos)
    loupe.style.width = `${PIXEL_WIDTH-2}px`
    loupe.style.height = `${PIXEL_WIDTH-2}px`
    loupe.style.pointerEvents = 'none'
    loupe.style.border = '2px solid #888'
    loupe.style.borderRadius = '3px'
  }
}

function updateImage (vnode) {
  if (vnode.attrs.game.imageUrl() !== vnode.state.lastImageUrl) {
    vnode.state.lastImageUrl = vnode.attrs.game.imageUrl()
    if (vnode.attrs.game.hasImage()) {
      let thisImageUrl = vnode.attrs.game.imageUrl()
      vnode.attrs.game.image().then(imgCanvas => {
        fabric.Image.fromURL(imgCanvas.toDataURL(), function(imgObj) {
          if (vnode.state.lastImageUrl === thisImageUrl) { // ensure it hasn't been changed again in the meantime
            vnode.state.imgCanvas = imgCanvas
            vnode.state.canvas.setHeight(imgCanvas.height)
            vnode.state.canvas.setWidth(imgCanvas.width)
            vnode.state.img = imgObj
            vnode.state.img.selectable = false
            m.redraw()
          }
        })
      })
    } else {
      vnode.state.imgCanvas = null
      vnode.state.canvas.setHeight(500)
      vnode.state.canvas.setWidth(500)
      vnode.state.img = null
    }
  }
}

function pixelColor (vnode, pos) {
  let pixelData = vnode.state.imgCanvas.getContext('2d').getImageData(pos.x, pos.y, 1, 1).data
  return `rgba(${pixelData.join(',')})`
}

function updateCanvas (vnode) {
  let {canvas, tool, img} = vnode.state
  let game = vnode.attrs.game
  canvas.clear()
  let canEdit = vnode.attrs.role === vnode.state.viewingPlayer
  canvas.isDrawingMode = canEdit && vnode.state.tool === 'sketch'
  canvas.freeDrawingBrush.color = vnode.attrs.role === 'red' ? COLORS.RED_FULL : COLORS.BLUE_FULL
  canvas.freeDrawingBrush.width = 10
  canvas.hoverCursor = 'default'
  canvas.selection = false
  if (canEdit && tool !== 'erase') {
    canvas.hoverCursor = 'crosshair'
  }
  if (img && (game.currentPlayer !== 'judge' || vnode.state.revealImage)) {
    canvas.add(img)
  }
  function sketchHandler (color) {
    return ([player, sketchId, sketch]) => {
      let sketchData = JSON.parse(sketch)
      var path = new fabric.Path(sketchData.path)
      path.firebaseId = sketchId
      path.playerName = player
      path.set({
        strokeWidth: 10,
        stroke: color,
        strokeLineCap: 'round',
        fill: '',
        top: sketchData.top,
        left: sketchData.left,
        hoverCursor: (canEdit && tool === 'erase' && player === game.currentPlayer) ? 'pointer' : null,
        selectable: false})
      canvas.add(path)
    }
  }
  function getSketches(player) {
    let sketches = game.sketches(player)
    return Object.keys(sketches).map(k => [player, k, sketches[k]])
  }
  if (vnode.state.viewingPlayer === 'red') {
    getSketches('blue').forEach(sketchHandler(COLORS.BLUE_FADED))
    getSketches('red').forEach(sketchHandler(COLORS.RED))
  } else {
    getSketches('red').forEach(sketchHandler(COLORS.RED_FADED))
    getSketches('blue').forEach(sketchHandler(COLORS.BLUE))
  }
  function pixelHandler (color) {
    return ({x,y}) => {
      if (vnode.state.imgCanvas) {
        let rect = new fabric.Rect({
          left: x - PIXEL_WIDTH/2 + 0.5,
          top: y - PIXEL_WIDTH/2 + 0.5,
          fill: pixelColor(vnode, {x,y}),
          width: PIXEL_WIDTH,
          height: PIXEL_WIDTH,
          stroke: color,
          strokeWidth: 2,
          selectable: false,
          rx: 3,
          ry: 3
        })
        canvas.add(rect)
      }
    }
  }
  game.pixels('red').forEach(pixelHandler(COLORS.RED_FULL))
  game.pixels('blue').forEach(pixelHandler(COLORS.BLUE_FULL))
  updateLoupe(vnode)
  updateImage(vnode)
}

export default {
  oninit: (vnode) => {
    vnode.state.tool = 'sketch' // either 'sketch', 'pixel', 'erase'
    vnode.state.viewingPlayer = vnode.attrs.role === 'blue' ? 'blue' : 'red'
    vnode.state.revealImage = false
    vnode.state.mousePos = null
    vnode.state.lastImageUrl = ""
    vnode.state.img = null
    vnode.state.imgCanvas = null
  },
  oncreate: (vnode) => {
    vnode.state.canvas = new fabric.Canvas('play')
    vnode.state.canvas.setHeight(500)
    vnode.state.canvas.setWidth(500)
    vnode.state.canvas.on('path:created', ({path}) => {
      let pathString = path.toJSON().path.map(p => p.join(' ')).join(' ')
      vnode.attrs.game.addSketch(JSON.stringify({path: pathString, left: path.left, top: path.top}))
      m.redraw()
    })
    vnode.state.canvas.on('mouse:down', ({e, target}) => {
      if (target && target.playerName && target.playerName === vnode.attrs.role && vnode.state.tool === 'erase') {
        vnode.attrs.game.removeSketch(target.firebaseId)
        m.redraw()
      }
      if (vnode.state.tool === 'pixel') {
        let {x, y} = vnode.state.canvas.getPointer(e)
        vnode.attrs.game.addPixel(x, y)
      }
    })
    vnode.state.canvas.on('mouse:move', ({e}) => {
      let {x, y} = vnode.state.canvas.getPointer(e)
      updateLoupe(vnode, {x, y})
    })
    vnode.state.canvas.on('mouse:out', ({e}) => {
      updateLoupe(vnode, null)
    })
    updateCanvas(vnode)
  },
  onupdate: (vnode) => {
    updateCanvas(vnode)
  },
  view: (vnode) => {
    const stateButton = (type, name, label, disable=false) => {
      return m('button', {
        disabled: vnode.state[type] === name || disable,
        onclick: () => {vnode.state[type] = name}
      }, label)
    }

    let playerbar = m('div', [
      stateButton('viewingPlayer', 'red', vnode.attrs.role === 'red' ? 'Your Drawing' : "Red's Drawing"),
      stateButton('viewingPlayer', 'blue', vnode.attrs.role === 'blue' ? 'Your Drawing' : "Blue's Drawing"),
    ])

    let toolbar = []
    if (vnode.attrs.role === 'judge') {
      if (vnode.attrs.game.isFull()) {
        toolbar.push(m('button', {disabled: true}, 'Already have 2 debaters'))
      } else {
        toolbar.push(m('button', {onclick: () => {
          vnode.attrs.game.becomeDebater().then(color => {
            if (color) {
              vnode.state.viewingPlayer = color
            }
          })
        }}, 'Become Debater'))
      }
      toolbar.push(stateButton('revealImage', true, 'Reveal Image', !vnode.attrs.game.hasImage()))
    } else {
      if (vnode.attrs.role === vnode.state.viewingPlayer) {
        toolbar = toolbar.concat([
          stateButton('tool', 'sketch', 'Sketch Tool'),
          stateButton('tool', 'pixel', 'Pixel Reveal Tool'),
          stateButton('tool', 'erase', 'Eraser'),
        ])
      }
    }
    toolbar.push(m('button', {onclick: () => {
      vnode.attrs.game.reset()
    }}, 'Reset Board + Roles'))

    return m('div', [
      m(ImageSelector, {game: vnode.attrs.game}),
      m('div', `You are ${vnode.attrs.role}. Your game code is ${vnode.attrs.game.code}`),
      playerbar,
      m('div', {style: 'position: relative;'}, [
        m('canvas#play', {style: 'border: 1px solid #ccc'}),
        vnode.state.tool === 'pixel' ? m('div#loupe') : null
      ]),
      m('div', toolbar),
    ])
  }
}
