import {ERASER_SIZE, PIXEL_DENSITY} from './constants'

export function setCanvasSize (canvas, width, height) {
  canvas.width = width * PIXEL_DENSITY
  canvas.height = height * PIXEL_DENSITY
  canvas.style.maxWidth = `${width}px`
  canvas.style.maxHeight = `${height}px`
}

export function getMouseCoords (canvas, event) {
  let bounds = canvas.getBoundingClientRect()
  if (event.changedTouches) {
    event = event.changedTouches[0]
  }
  let mult = (canvas.width / PIXEL_DENSITY) / canvas.offsetWidth // may need to multiply if canvas is shrunk by width of page
  return {x: (event.clientX - bounds.left) * mult, y: (event.clientY - bounds.top) * mult}
}

export function normalizeRect (currentRect) {
  let {x1, x2, y1, y2} = currentRect
  x1 = Math.round(x1)
  x2 = Math.round(x2)
  y1 = Math.round(y1)
  y2 = Math.round(y2)
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x1 - x2),
    h: Math.abs(y1 - y2)
  }
}

export function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}

// returns clicked rect at x, y
// return null if no rect within +- 10 pixels of clicked point
// also always counts rects no matter how far border is if cursor is inside bounds
export function closestRect (rectangles, x, y) {
  let best = null
  let bestDist = null
  Object.keys(rectangles).forEach(rectId => {
    let rect = rectangles[rectId]
    let overallDist = Math.min(
      manhattanDistToFilledRect(x, y, rect.x, rect.y, 1, rect.h),
      manhattanDistToFilledRect(x, y, rect.x, rect.y, rect.w, 1),
      manhattanDistToFilledRect(x, y, rect.x + rect.w, rect.y, 1, rect.h),
      manhattanDistToFilledRect(x, y, rect.x, rect.y + rect.h, rect.w, 1)
    )
    let validRect = overallDist < ERASER_SIZE || (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h)
    if ((bestDist === null || overallDist < bestDist) && validRect) {
      bestDist = overallDist
      best = rectId
    }
  })
  return best
}

function manhattanDistToFilledRect (pointX, pointY, x, y, w, h) {
  let totalDist = 0
  if (pointX < x) {
    totalDist += x - pointX
  } else if (pointX > x + w) {
    totalDist += pointX - (x + w)
  }
  if (pointY < y) {
    totalDist += y - pointY
  } else if (pointY > y + h) {
    totalDist += pointY - (y + h)
  }
  return totalDist
}
