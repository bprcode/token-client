const watchedElement = document.querySelector('.globe-section')

function loadImages() {
  const loadList = document.querySelectorAll('.lazy')

  for (const i of loadList) {
    i.addEventListener('load', onLoad)
    i.src = i.dataset.src
  }
}

function onLoad(event) {
  const target = event.target
  target.classList.add('fade-in')

  setTimeout(() => {
    target.classList.remove('lazy')
    target.classList.remove('fade-in')
  }, 750)

  target.removeEventListener('load', onLoad)
}

function watch(entries, observer) {
  for (const e of entries) {
    if (e.isIntersecting) {
      observer.unobserve(watchedElement)
      loadImages()
    }
  }
}

const loadObserver = new IntersectionObserver(watch, {
  threshold: 0.01,
})

setTimeout(() => {
  if (window.scrollY === 0) {
    loadObserver.observe(watchedElement)
  } else {
    loadImages()
  }
}, 100)

if (
  navigator.userAgent.includes('Mobile') &&
  navigator.userAgent.includes('Firefox')
) {
  document.querySelector('header').classList.add('firefox-mobile-header')
  document.querySelector('footer').classList.add('firefox-mobile-footer')
}
