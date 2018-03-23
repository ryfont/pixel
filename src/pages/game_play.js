import m from 'mithril'
import {fabric} from 'fabric'

function updateCanvas(vnode) {
  let canvas = vnode.state.canvas
  let game = vnode.attrs.game
  canvas.clear()
  game.sketches("red").forEach(sketch => {
    let sketchData = JSON.parse(sketch)
    var path = new fabric.Path(sketchData.path);
    path.set({ strokeWidth: 10, stroke: "#f00", strokeLineCap: "round", fill: 'transparent', top: sketchData.top, left: sketchData.left});
    canvas.add(path);
  })
  game.sketches("blue").forEach(sketch => {
    let sketchData = JSON.parse(sketch)
    var path = new fabric.Path(sketchData.path);
    path.set({ strokeWidth: 10, stroke: "#00f", strokeLineCap: "round", fill: 'transparent', top: sketchData.top, left: sketchData.left});
    canvas.add(path);
  })
}

export default {
  oncreate: (vnode) => {
    vnode.state.canvas = new fabric.Canvas('play', {
      isDrawingMode: vnode.attrs.game.currentPlayer !== 'judge',
      selection: false
    })
    let canvas = vnode.state.canvas
    canvas.freeDrawingBrush.color = vnode.attrs.game.currentPlayer === "red" ? "#f00" : "#00f"
    canvas.freeDrawingBrush.width = 10
    canvas.on('path:created', ({path}) => {
      console.log(path)
      let pathString = path.toJSON().path.map(p => p.join(" ")).join(" ")
      vnode.attrs.game.addSketch(JSON.stringify({path: pathString, left: path.left, top: path.top}))
      m.redraw()
    })
    updateCanvas(vnode)
  },
  onupdate: (vnode) => {
    updateCanvas(vnode)
  },
  view: (vnode) => {
    return m("canvas#play", {width: 500, height: 500})
  },
}

