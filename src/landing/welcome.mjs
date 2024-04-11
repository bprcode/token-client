const watchedElement = document.querySelector('.globe-section')
const mainSections = [...document.querySelectorAll('main section')].map(s => ({
  element: s,
  midline: s.offsetTop + s.getBoundingClientRect().height / 2,
  bottom: s.offsetTop + s.getBoundingClientRect().height,
  img: s.querySelector('img'),
}))

function overwriteRAF(callback) {
  if (!overwriteRAF.callback) {
    requestAnimationFrame(() => {
      overwriteRAF.callback()
      overwriteRAF.callback = null
    })
  }

  overwriteRAF.callback = callback
}

function onScroll() {
  overwriteRAF(() => {
    const scrollBottom = window.scrollY + window.innerHeight

    for (const s of mainSections) {
      if (!s.img.classList.contains('scroll-aware')) {
        continue
      }

      const midline =
        s.element.offsetTop + s.element.getBoundingClientRect().height / 2
      const ny = (scrollBottom - midline) / window.innerHeight

      s.img.style.opacity = 0.25 + 2 * ny
    }
  })
}

function loadImages() {
  const loadList = document.querySelectorAll('.lazy')

  for (const i of loadList) {
    i.addEventListener('load', onLoad)

    setTimeout(() => {
      i.src = i.dataset.src
    }, 0)
  }
}

function onLoad(event) {
  const target = event.target
  target.classList.add('fade-in')

  setTimeout(() => {
    target.classList.remove('lazy')
    target.classList.remove('fade-in')
    target.classList.add('scroll-aware')
  }, 750)

  target.removeEventListener('load', onLoad)
}

function watchMain(entries, observer) {
  for (const e of entries) {
    console.log(e, 'is intersecting?', e.isIntersecting)
    if (e.isIntersecting) {
      observer.unobserve(watchedElement)
      loadImages()
    }
  }
}

const loadObserver = new IntersectionObserver(watchMain, {
  threshold: 0.01,
})

if (window.scrollY === 0) {
  loadObserver.observe(watchedElement)
} else {
  loadImages()
}

window.addEventListener('scroll', onScroll)

if (
  navigator.userAgent.includes('Mobile') &&
  navigator.userAgent.includes('Firefox')
) {
  document.querySelector('header').classList.add('firefox-mobile-header')
  document.querySelector('footer').classList.add('firefox-mobile-footer')
}
