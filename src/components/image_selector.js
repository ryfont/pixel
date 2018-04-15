import m from 'mithril'

function loadImages (vnode) {
  if (vnode.state.searchText && isUrl(vnode.state.searchText) || vnode.state.searchText.match('^ *$')) {
    return
  }
  m.jsonp({
    url: "https://www.flickr.com/services/rest",
    data: {
      format: 'json',
      api_key: 'ba8a19a3cb594eacd876d73d36c531c4',
      method: 'flickr.photos.search',
      tags: vnode.state.searchText,
      content_type: 1,
      license: '1,2,3,4,5,6,7,8,9,10',
      extras: 'owner_name,url_m,url_l,url_t,path_alias'
    },
    callbackKey: "jsoncallback"
  })
  .then(function(result) {
    vnode.state.libraryData = []
    console.log(result)
    if (!result.photos || !result.photos.photo) {
      console.error('bad response from flickr server:', result)
    }
    let photos = Object.values(result.photos.photo)
    while (photos.length > 0 && vnode.state.libraryData.length < 16) {
      let i = Math.floor(Math.random()*photos.length)
      let item = photos.splice(i, 1)[0]
      vnode.state.libraryData.push(item)
    }
  })
}

function debounce (fn, time) {
  let lastArgs = null
  let isSet = false
  return function() {
    lastArgs = arguments
    if (!isSet) {
      isSet = true
      setTimeout(() => {
        fn.apply(null, lastArgs)
        isSet = false
      }, time)
    }
  }
}

function isUrl (str) {
  return !!str.match(/^https?:\/\/(.+)\.(.+)/)
}

function setImg (vnode, url, attribution={url:'', text:''}) {
  vnode.attrs.game.setImageUrl(url, attribution)
    .then(() => {
      vnode.state.loading = false
      vnode.state.searchText = ""
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
    vnode.state.searchText = ""
    vnode.state.error = null
    vnode.state.libraryData = null
    vnode.state.loadImagesDebounced = debounce(loadImages, 1000)
  },
  view: (vnode) => {
    let g = vnode.attrs.game

    let libraryView = null
    if (vnode.state.libraryData !== null) {
      if (vnode.state.libraryData === null) {
        libraryView = m('div', 'Loading Flickr images...')
      } else {
        libraryView = m('div', vnode.state.libraryData.map(flickrImg => {
          let imageUrl = flickrImg.url_t
          return m('a', {href: '#', onclick: (e) => {
            e.preventDefault()
            if (!vnode.state.loading) {
              vnode.state.searchText = ""
              vnode.state.error = null
              vnode.state.libraryData = null
              vnode.state.loading = true
              let attribution = {
                url: `https://www.flickr.com/photos/${flickrImg.pathalias||flickrImg.owner}/${flickrImg.id}`,
                text: `Photo by ${flickrImg.ownername}`
              }
              setImg(vnode, flickrImg.url_l || flickrImg.url_m || flickrImg.url_t, attribution)
            }
          }}, [
            m('img', {style: 'max-width: 100px; max-height: 100px;', src: imageUrl})
          ])
        }))
      }
    }

    return m('div', [
      m('form', {style: 'display: inline;'}, [
        m('input', {
          placeholder: 'Image Search (or Custom Image URL)',
          size: 50,
          disabled: vnode.state.loading,
          value: vnode.state.searchText,
          oninput: (e) => {
            vnode.state.searchText = e.target.value
            vnode.state.error = null
            vnode.state.libraryData = null
            vnode.state.loadImagesDebounced(vnode)
          }
        }),
        isUrl(vnode.state.searchText) ? m('button', {
          type: 'submit',
          disabled: vnode.state.loading,
          onclick: (e) => {
            e.preventDefault()
            vnode.state.loading = true
            setImg(vnode, vnode.state.searchText)
          }
        }, 'Set Image URL') : null,
        vnode.state.error ? m('span', vnode.state.error) : null,
        libraryView
      ])
    ])
  }
}
