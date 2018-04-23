import m from 'mithril'
import GameSelectionPage from './pages/game_selection'
import GamePlayPage from './pages/game_play'
import {Game} from './state'

const GamePage = {
  oninit: (vnode) => {
    vnode.state.game = new Game(vnode.attrs.code, vnode.attrs.role, (newRole) => {
      m.route.set('/game/:code/:role', {code: vnode.attrs.code, role: newRole}, {replace: true})
    })
    vnode.state.game.onUpdate(m.redraw)
  },
  view: (vnode) => {
    if (vnode.state.game.isLoading()) {
      return m('div', 'Loading game...')
    } else {
      return m(GamePlayPage, {game: vnode.state.game, role: vnode.attrs.role})
    }
  }
}

const RedirectToJudge = {
  oninit: (vnode) => {
    m.route.set('/game/:code/:role', {code: vnode.attrs.code, role: 'judge'}, {replace: true})
  },
  view: (vnode) => {
    return m('div', 'Loading game...')
  }
}

m.route.prefix('')
m.route(document.getElementById('page'), '/', {
  '/': GameSelectionPage,
  '/game/:code': RedirectToJudge,
  '/game/:code/:role': GamePage
})
