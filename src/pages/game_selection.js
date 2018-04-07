import m from 'mithril'
import {freshNewGame, gameExists} from '../state'

export default {
  oninit: (vnode) => {
    vnode.state.gameIdText = ''
    vnode.state.loading = false
    vnode.state.error = null
  },
  view: (vnode) => {
    return m('div', [
      m('button', {
        disabled: vnode.state.loading,
        onclick: () => {
          vnode.state.loading = true
          freshNewGame().then((code) => {
            m.route.set('/game/:code/judge', {code: code})
          })
        }
      }, 'Create New Game'),
      m('div', 'To join an existing game, use the link listed in your friend\'s game')
    ])
  }
}
