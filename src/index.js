import m from 'mithril'
import GameSelectionPage from './pages/game_selection'
import PlayerSelectionPage from './pages/player_selection'
import GamePlayPage from './pages/game_play'

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