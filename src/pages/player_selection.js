import m from 'mithril'

export default {
  oninit: (vnode) => {
    vnode.state.loading = false
  },
  view: (vnode) => {
    let g = vnode.attrs.game
    let leaveGameButton = m('button', {
      onclick: () => {
        vnode.attrs.setGame(null)
      }
    }, 'Leave Game')
    if (vnode.attrs.game.gameFull()) {
      return m('div', [
        m('p', 'Looks like this game is already full. Try another one?'),
        leaveGameButton
      ])
    }
    return m('div', [
      m('p', `Your game code: ${g.code}`),
      m('div', ['red', 'blue', 'judge'].map(p => {
        let button = null
        if (g.currentPlayer === p) {
          button = m('button', {disabled: true}, 'Selected')
        } else if (g.players()[p] === 0 && g.currentPlayer === null) {
          button = m('button', {
            disabled: vnode.state.loading,
            onclick: () => {
              vnode.state.loading = true
              g.setCurrentPlayer(p).then(() => {
                vnode.state.loading = false
                m.redraw()
              })
            }
          }, 'Select')
        } else if (g.players()[p] === 0) {
          button = ' waiting for somebody to join...'
        }
        return m('p', [
          p,
          button
        ])
      })),
      leaveGameButton
    ])
  }
}
