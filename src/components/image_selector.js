import m from 'mithril'

export default {
  oninit: (vnode) => {
    vnode.state.loading = false
    vnode.state.imageUrlText = ""
    vnode.state.error = null
  },
  view: (vnode) => {
    let g = vnode.attrs.game
    return m('div', [
      m('form', {style: 'display: inline;'}, [
        m('input', {
          placeholder: 'New Image URL',
          disabled: vnode.state.loading,
          value: vnode.state.imageUrlText,
          oninput: (e) => {
            vnode.state.imageUrlText = e.target.value
          }
        }),
        m('button', {
          type: 'submit',
          disabled: vnode.state.loading,
          onclick: (e) => {
            e.preventDefault()
            vnode.state.loading = true
            g.setImageUrl(vnode.state.imageUrlText)
              .then(() => {
                vnode.state.loading = false
                m.redraw()
              })
              .catch((e) => {
                vnode.state.loading = false
                vnode.state.error = `Either that image couldn't be found, or isn't set up to allow loading from other domains: ${e}`
                m.redraw()
              })
          }
        }, 'Update Image'),
        vnode.state.error ? m('p', vnode.state.error) : null
      ])
    ])
  }
}
