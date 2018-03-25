import m from 'mithril'

export default {
  oninit: (vnode) => {
    vnode.state.loading = false
    vnode.state.imageUrlText = ""
  },
  view: (vnode) => {
    let g = vnode.attrs.game
    if (g.isImageSelector()) {
      return m('div', [
        "You are the image selector! Your job is to choose an image, and then truthfully describe the image to the judge.",
        m('form', [
          m('input', {
            placeholder: 'Image URL',
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
                  m.redraw()
                })
                .catch(() => {
                  vnode.state.loading = false
                  vnode.state.error = `Either that image couldn't be found, or isn't set up to allow loading from other domains.`
                  m.redraw()
                })
            }
          }, 'Set Image'),
          vnode.state.error ? m('p', vnode.state.error) : null
        ])
      ])
    } else if (g.isLiar()) {
      return m('div', "You are the liar! Your job is to lie about the true identity of the image. We're waiting for the other player to select an image...")
    } else {
      return m('div', "You are the judge! One of the two players will be lying about the identity of the image, and it's your job to correctly guess who.")
    }
  }
}
