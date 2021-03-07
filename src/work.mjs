import { setSectionObserver } from '../utils/client/nav-sections'

const elements = {
  detailsSlideOut: document.getElementById('details-slide-out'),
}

const setVideoObserver = (videos) => {
  const observer = new IntersectionObserver(
    (changes) => {
      for (const { target, isIntersecting } of changes) {
        if (isIntersecting) {
          target.load()
          target.play()
        }
      }
    },
    {
      root: null,
      rootMargin: '0px 0px 0px 0px',
      threshold: 0,
    }
  )
  for (const video of videos) {
    observer.observe(video)
  }
  return observer
}

const showSlideOut = () => {
  elements.detailsSlideOut.style.visibility = 'visible'
}

const hideSlideOutOnEmptyHash = () => {
  if (location.hash === '') {
    elements.detailsSlideOut.style.visibility = 'hidden'
  }
}

export default () => {
  const clickListener = (event) => {
    const { target } = event
    if (
      target.tagName === 'A' &&
      target.origin === location.origin &&
      target.hash &&
      target.hasAttribute('data-proj-link')
    ) {
      showSlideOut()
      location.replace(target.href)
    }

    if (target.id === 'close-btn') {
      event.preventDefault()
      location.replace(target.href)
    }
  }

  const sectionIds = ['ongoing-section', 'complete-section']
  const cleanupSectionObserver = setSectionObserver(sectionIds)

  // lazily load videos once tab is visited
  const videoEls = document.querySelectorAll('[data-page="work"] video')
  const videoObserver = setVideoObserver(videoEls)

  document.addEventListener('click', clickListener)

  if (window.location.hash) {
    showSlideOut()
  }

  elements.detailsSlideOut.addEventListener(
    'transitionend',
    hideSlideOutOnEmptyHash
  )

  //cleanup
  return () => {
    cleanupSectionObserver()
    videoObserver.disconnect()
    document.removeEventListener('click', clickListener)
    elements.detailsSlideOut.removeEventListener(
      'transitionend',
      hideSlideOutOnEmptyHash
    )
  }
}
