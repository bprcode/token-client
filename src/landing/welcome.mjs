console.log('welcome.mjs imported.')

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

function onScroll(event) {
  overwriteRAF(() => {
    const scrollBottom = window.scrollY + window.innerHeight

    for (const s of mainSections) {
      const ny = (s.bottom - scrollBottom) / window.innerHeight
      console.log(s, ny)
      s.img.style.opacity = (1 - ny)
    }
    
  })
}

function loadImages() {
  const loadList = document.querySelectorAll('.lazy')

  for (const i of loadList) {
    console.log('should now load ', i.dataset.src)
    setTimeout(() => {
      console.log('setting i', 'to', i.dataset.src)
      i.src = i.dataset.src
      i.classList.add('seen')
    }, 1000)
  }
}

function watchMain(entries, observer) {
  for (const e of entries) {
    console.log(e, 'is intersecting?', e.isIntersecting)
    if (e.isIntersecting) {
      observer.unobserve(watchedElement)
      document.querySelector('h1').innerText = '👁️ #seen#'

      loadImages()
    }
  }
}

// function watchImages(entries, observer) {
//   for (const e of entries) {
    
//     console.log(e.intersectionRatio, e.target)
//     // console.log(i, 'has intersection ratio', i.intersectionRatio)

//   }
// }

const loadObserver = new IntersectionObserver(watchMain, {
  threshold: 0.01,
})

// const imageObserver = new IntersectionObserver(watchImages)

// for(const e of document.querySelectorAll('main section')) {
//   console.log('checking e:',e.querySelector('img'))
//   imageObserver.observe(e.querySelector('img'))
// }

if (window.scrollY === 0) {
  loadObserver.observe(watchedElement)
} else {
  console.log('immediately load images')
  loadImages()
}

document.querySelector('h1').innerText = '😴 scrollY=' + window.scrollY

window.addEventListener('scroll', onScroll)
