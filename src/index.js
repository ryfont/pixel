import m from 'mithril'
import GameSelectionPage from './pages/game_selection'
import PlayerSelectionPage from './pages/player_selection'
import ImageSelectionPage from './pages/image_selection'
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
    }
    switch (vnode.state.game.currentState()) {
      case 'loading':
        return m('div', 'Loading game...')
      case 'player_selection':
        return m(PlayerSelectionPage, {game: vnode.state.game, setGame})
      case 'full':
        return m('div', [
          'Looks like that game is full. Try another?',
          m('button', {
            onclick: () => setGame(null),
          }, 'Leave Game')
        ])
      case 'image_selection':
        return m(ImageSelectionPage, {game: vnode.state.game, setGame})
      case 'playing':
        return m(GamePlayPage, {game: vnode.state.game, setGame})
    }
  }
}

m.mount(document.getElementById('page'), Page)
