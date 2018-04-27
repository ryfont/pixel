import m from 'mithril'
import {freshNewGame} from '../state'
import {short_description, long_description} from '../components/description'

export default {
  oninit: (vnode) => {
    vnode.state.gameIdText = ''
    vnode.state.loading = false
    vnode.state.error = null
  },
  view: (vnode) => {
    return m('div.col.gap-3.left', [
      short_description(false),
      m('button', {
        disabled: vnode.state.loading,
        onclick: () => {
          vnode.state.loading = true
          freshNewGame().then((code) => {
            m.route.set('/game/:code/judge', {code: code})
          })
        }
      }, 'Create New Game'),
      m('p', 'To join an existing game, use the link listed in your friend\'s game.'),
      long_description(),
    ])
  }
}
