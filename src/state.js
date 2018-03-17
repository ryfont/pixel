const firebase = require('firebase/app')
require('firebase/database')
const config = require('../config')
const app = firebase.initializeApp(config)

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

  players () {
    this.state.players
  }

  currentPlayer () {
    return this.currentPlayer
  }

  setCurrentPlayer (player) {
    // TODO update database to reject new edits of player
    return this.dbref
      .child('players').child(player)
      .set(1)
      .then(() => {
        // successfully set player
        this.currentPlayer = player
      })
  }

  // generates new game code and creates new game for it, and returns a promise containing the new game object
  static createNew () {
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
              drawings: {red: {}, blue: {}},
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
}