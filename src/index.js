import m from 'mithril'
import GameSelectionPage from './pages/game_selection'
import ImageSelectionPage from './pages/image_selection'
import GamePlayPage from './pages/game_play'
import {Game} from './state'

const GamePage = {
  oninit: (vnode) => {
    vnode.state.game = new Game(vnode.attrs.code, vnode.attrs.role)
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

m.route(document.getElementById('page'), "/", {
    "/": GameSelectionPage,
    "/game/:code/:role": GamePage,
})
