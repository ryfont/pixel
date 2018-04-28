import firebase from 'firebase/app'
import {} from 'firebase/database'
import config from '../config'
import md5 from 'js-md5'
const pica = require('pica/dist/pica')()

const app = firebase.initializeApp(config)

function getImage (url) {
  return new Promise((resolve, reject) => {
    let i = new window.Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.crossOrigin = 'meow'
    i.src = url
  })
}

function resizedImage (url) {
  let dest = document.createElement('canvas')
  return getImage(url)
    .then(image => {
      if (image.width > image.height) {
        dest.width = 500
        dest.height = 500 / image.width * image.height
      } else {
        dest.height = 500
        dest.width = 500 / image.height * image.width
      }
      return pica.resize(image, dest)
    })
    .then(() => {
      dest.toDataURL() // make sure this doesn't error
      return dest
    })
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
    attribution: {url: '', text: ''},
    gameNum: gameNum,
    pixels: {red: {}, blue: {}},
    players: {blue: 0, red: 0},
    coinflip: 0
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
    this.onResets = []
    this.state = null
    this.code = gameId
    this.lastGameNum = null
    this.role = role // role of this player, either 'red' 'blue' 'judge'
    this.setRole = setRole
    this.connected = true
    this.dbref = app.database().ref(`games/${gameId}`)
    this.dbref.on('value', snap => {
      this.state = snap.val()
      this.onUpdates.forEach(f => { f() })
      if (this.lastGameNum !== null && this.lastGameNum !== this.state.gameNum) {
        // game has been reset!
        if (this.role !== 'judge') {
          this.setRole('judge')
          this.role = 'judge'
        }
        this.onResets.forEach(f => { f() })
      }
      this.lastGameNum = this.state.gameNum
    })
    app.database().ref('.info/connected').on('value', (connectedSnap) => {
      this.connected = connectedSnap.val()
      this.onUpdates.forEach(f => { f() })
    })
  }

  onUpdate (f) {
    this.onUpdates.push(f)
    f()
  }

  onReset (f) {
    this.onResets.push(f)
    f()
  }

  _checkCanDraw () {
    if (!this.state || !this.state.players || ['red', 'blue'].indexOf(this.role) === -1) {
      throw new Error('Can only draw if current player is red or blue')
    }
  }

  _addDrawing (drawingType, data) {
    this._checkCanDraw()
    const entry = Object.assign({player: this.role}, data)
    this.dbref.child(drawingType).push(entry)
  }

  _removeDrawing (drawingType, index) {
    this._checkCanDraw()
    this.dbref.child(drawingType).child(index).set(null)
  }

  // hash game code and state num to get who is the liar and who selects the image
  coinflipResult () {
    let firstChar = md5(`${this.code} ${this.state ? this.state.gameNum : '0'} ${this.state.coinflip}`)[0]
    return [['0', '1', '2', '3', '4', '5', '6', '7', '8'].indexOf(firstChar) === -1, firstChar]
  }

  coinflip () {
    return this.dbref.child('coinflip')
      .transaction((oldNum) => {
        return oldNum + 1
      })
  }

  pixels () {
    if (this.state && this.state.pixels) {
      return Object.values(this.state.pixels)
    }
    return []
  }

  addPixel (x, y) {
    this._addDrawing('pixels', {x: x, y: y})
  }

  imageUrl () {
    if (this.state && this.state.image) {
      return this.state.image
    }
    return ''
  }

  hasImage () {
    return this.imageUrl() !== ''
  }

  image () {
    if (this.imageUrl() === '') {
      return null
    }
    return resizedImage(this.imageUrl())
  }

  setImageUrl (url, attribution = {url: '', text: ''}) {
    return resizedImage(url)
      .then(() => {
        return this.dbref.child('image').set(url)
      })
      .then(() => {
        return this.dbref.child('attribution').set(attribution)
      })
  }

  attribution () {
    if (!this.state || !this.state.attribution || this.state.attribution.text.length === 0) {
      return null
    }
    return this.state.attribution
  }

  rectangles () {
    if (this.state && this.state.rectangles)
      return this.state.rectangles
    return {}
  }

  addRectangle (x, y, w, h) {
    this._addDrawing('rectangles', {x: x, y: y, w: w, h: h})
  }

  removeRectangle (rectId) {
    this._removeDrawing('rectangles', rectId)
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
