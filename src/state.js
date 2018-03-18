const firebase = require('firebase/app')
require('firebase/database')
const config = require('../config')
const app = firebase.initializeApp(config)

function parsePixel(s) {
  let nums = s.match(/(\d+)\,(\d+)/)
  return {
    x: s[1],
    y: s[2]
  }
}

function parseMultiplePixels(s) {
  return s.split("|").map(parsePixel)
}

// generates new game code and creates new game for it, and returns a promise containing the new game object
export function freshNewGame () {
  function genId (resolve) {
    var newId = "";
    var chars = "abcdefghijkmnpqrstuvwxyz23456789";

    for (let i=0; i < 7; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // not sure how to avoid the race condition here with firebase
    // but collisions are remarkably unlikely so I think it's ok
    let gameState = firebase.database().ref(`games/${newId}`)
    gameState
      .once('value')
      .then(snap => {
        if (snap.val() === null) {
          gameState.set({
            sketches: {red: {}, blue: {}},
            rectangles: {red: {}, blue: {}},
            image: "",
            pixels: {red: {}, blue: {}},
            players: {blue: 0, judge: 0, red: 0}
          })
          resolve(newId)
        } else {
          console.warn("GAME ALREADY EXISTS:", snap.val())
          genId(resolve)
        }
      })
  }

  return new Promise(function(resolve, reject) {
    genId(resolve)
  }).then((newId) => {
    return new Game(newId)
  })
}

export class Game {
  initialize (gameId) {
    this.onupdate = []
    this.state = null
    this.currentPlayer = null // role of this player, either 'red' 'blue' 'judge' or null
    this.dbref = firebase.database().ref(`games/${gameId}`)
    this.dbref.on('value', snap => {
      this.state = snap.val()
      this.onupdate.forEach(f => { f() })
    })
  }

  onupdate (f) {
    this.onupdate.push(f)
    f()
  }

  pixels () {
    let res = []
    if (this.state && this.state.pixels && this.state.pixels.blue) {
      res = res.concat(Object.values(this.state.pixels.blue))
    }
    if (this.state && this.state.pixels && this.state.pixels.red) {
      res = res.concat(Object.values(this.state.pixels.red))
    }
    return res.map(parsePixel)
  }

  _checkCanDraw () {
    if (!this.state || !this.state.players || ["red", "blue"].indexOf(this.currentPlayer) === -1) {
      throw "Can only draw if current player is red or blue"
    }
  }

  addPixel(x, y) {
    this._checkCanDraw()
    // normally you'd want to use .push() here, but since only one unique writer for each object,
    // we can keep track of it locally

    // TODO
  }

  sketches () {
    return this.state.sketches
  }

  addSketch () {
    this._checkCanDraw()
    // TODO
    // returns id of new sketch
  }

  removeSketch (sketchId) {
    this._checkCanDraw()
    // TODO
  }

  rectangles () {
    return this.state.rectangles
  }

  addRectangle () {
    this._checkCanDraw()
    // TODO
    // returns id of new rect
  }

  removeRectangle (rectId) {
    this._checkCanDraw()
    // TODO
  }

  players () {
    return this.state.players
  }

  currentPlayer () {
    return this.currentPlayer
  }

  setCurrentPlayer (player) {
    if (["red", "blue", "judge"].indexOf(player) === -1) {
      throw "Invalid player type"
    }
    // TODO update database to reject new edits of player
    return this.dbref
      .child('players').child(player)
      .set(1)
      .then(() => {
        // successfully set player
        this.currentPlayer = player
      })
  }

}