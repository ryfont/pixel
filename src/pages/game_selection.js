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
      m('form', [
        m('input', {
          placeholder: 'Existing game code',
          disabled: vnode.state.loading,
          value: vnode.state.gameIdText,
          oninput: (e) => {
            vnode.state.gameIdText = e.target.value
          }
        }),
        m('button', {
          type: 'submit',
          disabled: vnode.state.loading,
          onclick: (e) => {
            e.preventDefault()
            vnode.state.loading = true
            gameExists(vnode.state.gameIdText).then(exists => {
              if (exists) {
                m.route.set('/game/:code/judge', {code: vnode.state.gameIdText})
              } else {
                vnode.state.loading = false
                vnode.state.error = `Don't know of a game with code '${vnode.state.gameIdText}'`
              }
              m.redraw()
            })
          }
        }, 'Join Game'),
        vnode.state.error ? m('p', vnode.state.error) : null
      ])
    ])
  }
}
