import m from 'mithril'

function loadImages (vnode) {
  m.jsonp({
    url: "http://api.flickr.com/services/feeds/photos_public.gne",
    data: {
      format: 'json'
    },
    callbackKey: "jsoncallback"
  })
  .then(function(result) {
    vnode.state.libraryData = []
    while (result.items.length > 0 && vnode.state.libraryData.length < 16) {
      let i = Math.floor(Math.random()*result.items.length)
      let item = result.items.splice(i, 1)[0]
      vnode.state.libraryData.push(item['media']['m'].replace("_m", "_b"))
    }
  })
}

function setImg (vnode, url) {
  vnode.attrs.game.setImageUrl(url)
    .then(() => {
      vnode.state.loading = false
      vnode.state.error = null
      m.redraw()
    })
    .catch((e) => {
      vnode.state.loading = false
      vnode.state.error = `Either that image couldn't be found, or isn't set up to allow loading from other domains.`
      m.redraw()
    })
}

export default {
  oninit: (vnode) => {
    vnode.state.loading = false
    vnode.state.imageUrlText = ""
    vnode.state.error = null
    vnode.state.showLibrary = false
    vnode.state.libraryLoaded = false
    vnode.state.libraryData = null
  },
  view: (vnode) => {
    let g = vnode.attrs.game

    let libraryView = null
    if (vnode.state.showLibrary) {
      if (vnode.state.libraryData === null) {
        libraryView = m('div', 'Loading Flickr images...')
      } else {
        libraryView = m('div', vnode.state.libraryData.map(imageUrl => {
          return m('a', {href: '#', onclick: (e) => {
            e.preventDefault()
            vnode.state.showLibrary = false
            setImg(vnode, imageUrl)
          }}, [
            m('img', {style: 'max-width: 100px; max-height: 100px;', src: imageUrl})
          ])
        }))
      }
    }

    return m('div', [
      m('form', {style: 'display: inline;'}, [
        m('input', {
          placeholder: 'Custom Image URL',
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
            setImg(vnode, vnode.state.imageUrlText)
          }
        }, 'Update Image'),
        m('button', {onclick: () => {
          vnode.state.showLibrary = !vnode.state.showLibrary
          if (vnode.state.libraryLoaded === false) {
            vnode.state.libraryLoaded = true
            loadImages(vnode)
          }
        }}, 'Show/hide image library'),
        vnode.state.error ? m('span', vnode.state.error) : null,
        libraryView
      ])
    ])
  }
}
