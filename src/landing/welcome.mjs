console.log('welcome.mjs imported.')

const watchedElement = document.querySelector('.globe-section')

function loadImages() {
  const loadList = document.querySelectorAll('.lazy')

  for (const i of loadList) {
    console.log('should now load ', i.dataset.src)
    setTimeout(() => {
      console.log('setting i', 'to', i.dataset.src)
      i.src = i.dataset.src
      i.classList.add('seen')
    }, 3000)
  }
}

function watch(entries, observer) {
  for (const e of entries) {
    console.log(e, 'is intersecting?', e.isIntersecting)
    if (e.isIntersecting) {
      observer.unobserve(watchedElement)
      document.querySelector('h1').innerText = '👁️ #seen#'

      loadImages()
    }
  }
}

const observer = new IntersectionObserver(watch, {
  threshold: 0.01,
})

if (window.scrollY === 0) {
  observer.observe(watchedElement)
} else {
  console.log('immediately load images')
  loadImages()
}

document.querySelector('h1').innerText = '😴 scrollY=' + window.scrollY
