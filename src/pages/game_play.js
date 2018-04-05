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

function normalizeRect(currentRect) {
  let {x1,x2,y1,y2} = currentRect
  return {
    x: Math.round(Math.min(x1, x2)),
    y: Math.round(Math.min(y1, y2)),
    w: Math.round(Math.abs(x1-x2)),
    h: Math.round(Math.abs(y1-y2))
  }
}

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
          imgObj.selectable = false
          if (vnode.state.lastImageUrl === thisImageUrl) { // ensure it hasn't been changed again in the meantime
            vnode.state.imgCanvas = imgCanvas
            vnode.state.canvas.setHeight(imgCanvas.height)
            vnode.state.canvas.setWidth(imgCanvas.width)
            vnode.state.img = imgObj
            vnode.state.img.selectable
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
  updateImage(vnode)
  let {canvas, tool, img} = vnode.state
  let game = vnode.attrs.game
  canvas.clear()
  let canEdit = vnode.attrs.role === vnode.state.viewingPlayer
  canvas.hoverCursor = 'default'
  canvas.selection = false
  if (canEdit && tool !== 'erase') {
    canvas.hoverCursor = 'crosshair'
  }
  if (img && (vnode.attrs.role !== 'judge' || vnode.state.revealImage)) {
    canvas.add(img)
  }
  function drawRects (player, color) {
    function drawRect (x, y, w, h, id) {
      let rect = new fabric.Rect({
        left: x,
        top: y,
        fill: '',
        width: w,
        height: h,
        stroke: color,
        strokeWidth: 2,
        selectable: false,
        hoverCursor: (canEdit && tool === 'erase' && player === game.currentPlayer) ? 'pointer' : null
      })
      rect.firebaseId = id
      rect.playerName = player
      canvas.add(rect)
    }
    let rectangles = game.rectangles(player)
    Object.keys(rectangles).forEach(rectId => {
      let {x,y,w,h} = rectangles[rectId]
      drawRect(x,y,w,h,rectId)
    })
    if (vnode.state.currentRect) {
      let {x,y,w,h} = normalizeRect(vnode.state.currentRect)
      drawRect(x,y,w,h,-1)
    }
  }
  if (vnode.state.viewingPlayer === 'red') {
    drawRects('blue', COLORS.BLUE_FADED)
    drawRects('red', COLORS.RED)
  } else {
    drawRects('red', COLORS.RED_FADED)
    drawRects('blue', COLORS.BLUE)
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
          rx: 3,
          ry: 3,
          selectable: false
        })
        canvas.add(rect)
      }
    }
  }
  game.pixels('red').forEach(pixelHandler(COLORS.RED_FULL))
  game.pixels('blue').forEach(pixelHandler(COLORS.BLUE_FULL))
  updateLoupe(vnode)
}

export default {
  oninit: (vnode) => {
    vnode.state.tool = 'rect' // either 'rect', 'pixel', 'erase'
    vnode.state.viewingPlayer = vnode.attrs.role === 'blue' ? 'blue' : 'red'
    vnode.state.revealImage = false
    vnode.state.mousePos = null
    vnode.state.lastImageUrl = ""
    vnode.state.img = null
    vnode.state.imgCanvas = null
    vnode.state.currentRect = null
    vnode.state.rectEnd = null
  },
  oncreate: (vnode) => {
    vnode.state.canvas = new fabric.Canvas('play')
    vnode.state.canvas.setHeight(500)
    vnode.state.canvas.setWidth(500)
    vnode.state.canvas.on('mouse:down', ({e, target}) => {
      let {x, y} = vnode.state.canvas.getPointer(e)
      if (target && target.playerName && target.playerName === vnode.attrs.role && vnode.state.tool === 'erase') {
        vnode.attrs.game.removeRectangle(target.firebaseId)
      } else if (vnode.state.tool === 'pixel') {
        vnode.attrs.game.addPixel(x, y)
      } else if (vnode.state.tool === 'rect') {
        vnode.state.currentRect = {x1: x, y1: y, x2: x, y2: y}
      }
      m.redraw()
    })
    vnode.state.canvas.on('mouse:up', ({e, target}) => {
      if (target && target.playerName && target.playerName === vnode.attrs.role && vnode.state.tool === 'erase') {
        vnode.attrs.game.removeRectangle(target.firebaseId)
        m.redraw()
      }
      let {x, y} = vnode.state.canvas.getPointer(e)
      if (vnode.state.tool === 'pixel') {
        vnode.attrs.game.addPixel(x, y)
      } else if (vnode.state.tool === 'rect' && vnode.state.currentRect !== null) {
        let {x,y,w,h} = normalizeRect(vnode.state.currentRect)
        vnode.attrs.game.addRectangle(x,y,w,h)
        vnode.state.currentRect = null
        m.redraw()
      }
    })
    vnode.state.canvas.on('mouse:move', ({e}) => {
      let {x, y} = vnode.state.canvas.getPointer(e)
      updateLoupe(vnode, {x, y})
      if (vnode.state.currentRect) {
        vnode.state.currentRect.x2 = x
        vnode.state.currentRect.y2 = y
        m.redraw()
      }
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
          stateButton('tool', 'rect', 'Rectangle Tool'),
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
