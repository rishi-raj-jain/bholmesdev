import trimSlashes from './utils/trimSlashes'
import zip from './utils/zip'
import wipeAnimation from './utils/wipeAnimation'

const noop = () => {}
let prevPathname = location.pathname
let cleanupFn = noop

const getPageDiff = (page, prevPage) => {
  const [allPageEls, allPrevPageEls] = [page, prevPage].map((p) => [
    ...p.querySelectorAll('[data-page]'),
  ])

  const pageElPairs = zip(allPageEls, allPrevPageEls)
  for (let pair of pageElPairs) {
    if (
      pair[0].getAttribute('data-page') !== pair[1].getAttribute('data-page')
    ) {
      return pair
    }
  }
  return [null, null]
}

const animatePageIntoView = async (fullPage) => {
  const stylesheetSelector = 'head > link[rel="stylesheet"]'
  const oldStyles = [...document.querySelectorAll(stylesheetSelector)]
  const newStyles = [...fullPage.querySelectorAll(stylesheetSelector)]
  newStyles.forEach((style) => document.head.appendChild(style))

  const [page, prevPage] = getPageDiff(fullPage, document)
  const layoutContainer = prevPage.parentElement
  layoutContainer.style.position = 'relative'
  layoutContainer.insertBefore(page, prevPage)

  requestAnimationFrame(async () => {
    await wipeAnimation(page, prevPage, () =>
      layoutContainer.removeChild(prevPage)
    )
    oldStyles.forEach((style) => document.head.removeChild(style))
  })
}

const yoinkHTML = async (href) => {
  const response = await fetch(href)
  const htmlString = await response.text()
  const page = new DOMParser().parseFromString(htmlString, 'text/html')
  const title = page.querySelector('title').innerText
  return { page, title }
}

const yoinkJS = async (pathname) => {
  try {
    // TODO: determine base dir from eleventyConfig
    // currently hardcoded to src
    const js = await import(`./src/${pathname}/client.js`)

    return {
      main: js.default ?? (() => noop),
      options: js.options ?? {},
    }
  } catch (e) {
    return { main: () => noop, options: {} }
  }
}

const setPageTitle = (title = '') => {
  const titleEl = document.querySelector('title')
  if (titleEl) {
    titleEl.innerText = title
  } else {
    const titleEl = document.createElement('title')
    titleEl.innerText = title
    document.documentElement.appendChild(titleEl)
  }
}

const setVisiblePage = async ({ pathname = '', href = '' }) => {
  cleanupFn()
  const [{ page, title }, { main }] = await Promise.all([
    yoinkHTML(href),
    yoinkJS(trimSlashes(pathname)),
  ])
  setPageTitle(title)
  await (page && animatePageIntoView(page))
  // TODO: on quick navigation, it's possible to run the next page function
  // before the previous cleanup finishes
  // will probably need a queuing system to solve this
  cleanupFn = main()
  prevPathname = pathname
}

document.addEventListener('click', async (event) => {
  const { target } = event
  if (target.tagName === 'A' && target.origin === location.origin) {
    event.preventDefault()
    if (target.pathname !== prevPathname) {
      history.pushState({}, null, target.href)
      await setVisiblePage(target)
    }
  }
})

onpopstate = () => {
  setVisiblePage(location)
}

// on startup
;(async () => {
  const { main } = await yoinkJS(trimSlashes(location.pathname))
  cleanupFn = main()
})()
