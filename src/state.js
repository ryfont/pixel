import firebase from 'firebase/app'
import {} from 'firebase/database'
import config from '../config'
import md5 from 'js-md5'
const pica = require('pica/dist/pica')()

const app = firebase.initializeApp(config)

function getImage (url) {
  return new Promise((resolve, reject) => {
    let i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.crossOrigin = "meow"
    i.src = url
  })
}

function resizedImage (url) {
  let dest = document.createElement("canvas")
  return getImage(url)
    .then(image => {
      if (image.width > image.height) {
        dest.width = 500
        dest.height = 500/image.width*image.height
      } else {
        dest.height = 500
        dest.width = 500/image.height*image.width
      }
      return pica.resize(image, dest)
    })
    .then(() => {
      dest.toDataURL() // make sure this doesn't error
      return dest
    })
}

function parsePixel (s) {
  let nums = s.match(/(\d+),(\d+)/)
  let res = {
    x: parseInt(nums[1]),
    y: parseInt(nums[2])
  }
  return res
}

function parseMultiplePixels (s) {
  return s.split('|').map(parsePixel)
}

function serializeMultiplePixels (pixels) {
  let parts = []
  pixels.forEach(({x, y}) => {
    parts.push([x, y].join(','))
  })
  return parts.join('|')
}

function nextIndex (obj) {
  let i = 0
  while (obj[i] !== undefined) {
    i += 1
  }
  return i
}

// returns promise that resolves to true or false
export function gameExists (checkId) {
  let gameState = app.database().ref(`games/${checkId}`)
  return gameState
    .once('value')
    .then(snap => !!(snap.val()))
}

function gameTemplate (gameNum = 0) {
  return {
    rectangles: {red: {}, blue: {}},
    image: '',
    gameNum: gameNum,
    pixels: {red: {}, blue: {}},
    players: {blue: 0, judge: 0, red: 0}
  }
}

// generates new game code and creates new game for it, and returns a promise containing the new game object
export function freshNewGame () {
  function genId (resolve) {
    var newId = ''
    var chars = 'abcdefghijkmnpqrstuvwxyz23456789'

    for (let i = 0; i < 7; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // not sure how to avoid the race condition here with firebase
    // but collisions are remarkably unlikely so I think it's ok
    let gameState = app.database().ref(`games/${newId}`)
    gameState
      .once('value')
      .then(snap => {
        if (snap.val() === null) {
          gameState.set(gameTemplate())
          resolve(newId)
        } else {
          console.warn('GAME ALREADY EXISTS:', snap.val())
          genId(resolve)
        }
      })
  }

  return new Promise(function (resolve, reject) {
    genId(resolve)
  })
}

export class Game {
  constructor (gameId, role, setRole) {
    this.onUpdates = []
    this.state = null
    this.code = gameId
    this.lastGameNum = null
    this.role = role // role of this player, either 'red' 'blue' 'judge'
    this.setRole = setRole
    this.dbref = app.database().ref(`games/${gameId}`)
    this.dbref.on('value', snap => {
      this.state = snap.val()
      this.onUpdates.forEach(f => { f() })
      if (this.lastGameNum !== null && ['red', 'blue'].indexOf(this.role) >= 0 && this.lastGameNum !== this.state.gameNum) {
        // game has been reset!
        this.setRole('judge')
        this.role = 'judge'
      }
      this.lastGameNum = this.state.gameNum
    })
  }

  onUpdate (f) {
    this.onUpdates.push(f)
    f()
  }

  _checkCanDraw () {
    if (!this.state || !this.state.players || ['red', 'blue'].indexOf(this.role) === -1) {
      throw 'Can only draw if current player is red or blue'
    }
  }

  _addDrawing (drawingType, data) {
    this._checkCanDraw()

    // normally you'd want to use firebase's .push() here, but since only one unique writer for each object,
    // we can keep track of it locally
    let i = 0
    if (this.state[drawingType] !== undefined && this.state[drawingType][this.role] !== undefined) {
      i = nextIndex(this.state[drawingType][this.role])
    }
    this.dbref.child(drawingType).child(this.role).child(i).set(data)
    return i
  }

  _removeDrawing (drawingType, index) {
    this._checkCanDraw()
    this.dbref.child(drawingType).child(this.role).child(index).set(null)
    return index
  }

  // hash game code and state num to get who is the liar and who selects the image
  _redIsLiar () {
    let firstChar = md5(`${this.code} ${this.state?this.state.gameNum:'0'}`)[0]
    return ['0', '1', '2', '3', '4', '5', '6', '7', '8'].indexOf(firstChar) === -1
  }

  isImageSelector () {
    return this.role !== 'judge' && !this.isLiar()
  }

  isLiar () {
    let redLies = this._redIsLiar()
    return (redLies && this.role === 'red') || (!redLies && this.role === 'blue')
  }

  pixels (player) {
    if (this.state && this.state.pixels && this.state.pixels[player]) {
      return Object.values(this.state.pixels[player]).map(parsePixel)
    }
    return []
  }

  addPixel (x, y) {
    let str = serializeMultiplePixels([{x, y}])
    return this._addDrawing('pixels', str)
  }

  imageUrl () {
    if (this.state && this.state.image) {
      return this.state.image
    }
    return ""
  }

  hasImage () {
    return this.imageUrl() !== ""
  }

  image () {
    if (this.imageUrl() === "") {
      return null
    }
    return resizedImage(this.imageUrl())
  }

  setImageUrl (url) {
    return resizedImage(url)
      .then(() => {
        return this.dbref.child('image').set(url)
      })
  }

  rectangles (player) {
    if (this.state && this.state.rectangles && this.state.rectangles[player]) {
      let result = {}
      let rects = this.state.rectangles[player]
      Object.keys(rects).forEach(rectId => {
        let parsed = parseMultiplePixels(rects[rectId])
        result[rectId] = {x: parsed[0].x, y: parsed[0].y, w: parsed[1].x, h: parsed[1].y}
      })
      return result
    }
    return {}
  }

  addRectangle (x, y, w, h) {
    let str = serializeMultiplePixels([{x: x, y: y}, {x: w, y: h}])
    return this._addDrawing('rectangles', str)
  }

  removeRectangle (rectId) {
    return this._removeDrawing('rectangles', rectId)
  }

  players () {
    return this.state.players
  }

  isLoading () {
    return this.state === null
  }

  isFull () {
    return this.state.players.red === 1 && this.state.players.blue === 1
  }

  reset () {
    return this.dbref
      .transaction((oldGame) => {
        return gameTemplate(oldGame.gameNum + 1)
      })
  }

  becomeDebater () {
    let myColor = null
    return this.dbref
      .child('players')
      .transaction((players) => {
        if (players && players.red === 0) {
          myColor = 'red'
          players.red = 1
        } else if (players && players.red === 1 & players.blue === 0) {
          myColor = 'blue'
          players.blue = 1
        } else {
          myColor = null
        }
        return players
      })
      .then(() => {
        if (myColor) {
          this.setRole(myColor)
          this.role = myColor
        }
        return myColor
      })
      .catch((e) => {
        console.error(e)
        return null
      })
  }

  leave () {
    if (this.role !== null) {
      return this.dbref
        .child('players').child(this.role)
        .set(0)
    }
  }
}
