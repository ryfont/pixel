const firebase = require('firebase/app')
require('firebase/database')

const config = require('../config')

const app = firebase.initializeApp(config)

const game = firebase.database().ref("games/gameidhere")

window.game = game
