import {freshNewGame, Game, gameExists} from './state'
import m from 'mithril'

const GameSelectionPage = {
  oninit: (vnode) => {
    vnode.state.gameIdText = ""
    vnode.state.loading = false
    vnode.state.error = null
  },
  view: (vnode) => {
    return m("div", [
      m("button", {
        disabled: vnode.state.loading,
        onclick: () => {
          vnode.state.loading = true
          freshNewGame().then(vnode.attrs.setGame).then(m.redraw)
        }
      }, "Create New Game"),
      m("form", [
        m("input", {
          placeholder: 'Existing game code',
          disabled: vnode.state.loading,
          value: vnode.state.gameIdText,
          oninput: (e) => {
            vnode.state.gameIdText = e.target.value
          }
        }),
        m("button", {
          type: 'submit',
          disabled: vnode.state.loading,
          onclick: (e) => {
            e.preventDefault()
            vnode.state.loading = true
            gameExists(vnode.state.gameIdText).then(exists => {
              if (exists) {
                vnode.attrs.setGame(new Game(vnode.state.gameIdText))
              } else {
                vnode.state.loading = false
                vnode.state.error = `Don't know of a game with code '${vnode.state.gameIdText}'`
              }
              m.redraw()
            })
          }
        }, "Join Game"),
        vnode.state.error ? m("p", vnode.state.error) : null
      ])
    ])
  },
}

const PlayerSelectionPage = {
  oninit: (vnode) => {
    vnode.state.loading = false
  },
  view: (vnode) => {
    let g = vnode.attrs.game
    let leaveGameButton = m("button", {
      onclick: () => {
        vnode.attrs.setGame(null)
      }
    }, "Leave Game")
    if (vnode.attrs.game.gameFull()) {
      return m("div", [
        m("p", "Looks like this game is already full. Try another one?"),
        leaveGameButton
      ])
    }
    return m("div", [
      m("p", `Your game code: ${g.code}`),
      m("div", ["red", "blue", "judge"].map(p => {
        let button = null
        if (g.currentPlayer === p) {
          button = m("button", {disabled: true}, "Selected")
        } else if (g.players()[p] === 0 && g.currentPlayer === null) {
          button = m("button", {
            disabled: vnode.state.loading,
            onclick: () => {
              vnode.state.loading = true
              g.setCurrentPlayer(p).then(() => {
                vnode.state.loading = false
                m.redraw()
              })
            }
          }, "Select")
        } else if (g.players()[p] === 0) {
          button = " waiting..."
        }
        return m("p", [
          p,
          button
        ])
      })),
      leaveGameButton
    ])
  },
}

const GamePlayPage = {
  view: (vnode) => {
    return m("div", "play the game here!")
  },
}

const Page = {
  oninit: (vnode) => {
    vnode.state.game = null
  },
  view: (vnode) => {
    let setGame = (g) => {
      vnode.state.game = g
      if (g !== null) {
        g.onUpdate(m.redraw)
      }
    }
    if (vnode.state.game === null) {
      return m(GameSelectionPage, {setGame})
    } else if (vnode.state.game.isLoading()) {
      return m("div", "Loading game...")
    } else if (!vnode.state.game.gamePlaying()) {
      return m(PlayerSelectionPage, {game: vnode.state.game, setGame})
    } else {
      return m(GamePlayPage)
    }
  },
}

m.mount(document.getElementById('page'), Page)