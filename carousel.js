class Carousel {
    carousel = null
    speed = 0.25
    duration = 20
    interactTimeout = 4
    container = null
    slides = null
    prevBtn = null
    nextBtn = null
    index = 0
    slideCount = null
    lock = false
    interval = null
    delta
    xStart
    xLast
    yStart
    eStart
    tLast
    swipe
    velocity

    constructor(config) {
        this.carousel = document.getElementById(config.carousel)
        this.container = document.getElementById(config.container)
        this.slides = document.querySelectorAll(`.${config.slide}`)
        this.prevBtn = document.getElementById(config.prev)
        this.nextBtn = document.getElementById(config.next)
        this.slideCount = this.slides.length

        this.nextBtn &&
            this.nextBtn.addEventListener(
                'click',
                () => {
                    this.slideLeft(this.index)
                    this.resetTimer()
                },
                false
            )

        this.prevBtn &&
            this.prevBtn.addEventListener(
                'click',
                () => {
                    this.slideRight(this.index)
                    this.resetTimer()
                },
                false
            )

        this.container.addEventListener(
            'touchstart',
            this.onTouchStart.bind(this)
        )
        this.container.addEventListener(
            'touchmove',
            this.onTouchMove.bind(this)
        )
        this.container.addEventListener('touchend', this.onTouchEnd.bind(this))

        this.addNav()
        this.setTimer()
    }

    slideLeft() {
        this.cycle(1)
    }

    slideRight() {
        this.cycle(-1)
    }

    updateIndex(val) {
        this.index = (this.index + this.slideCount + val) % this.slideCount
    }

    recycle() {
        let _index =
            (this.index + Math.floor(this.slideCount / 2)) % this.slideCount
        let pos = Math.floor(-this.slideCount / 2)

        for (let _ = 0; _ < this.slideCount; _++) {
            this.slides[_index].style.left = `${pos * 100}%`
            this.slides[_index].style.transition = 'left 0s'
            pos++
            _index = (_index + 1) % this.slideCount
        }
    }

    cycle(dir) {
        if (this.lock || document.hidden) {
            return
        }

        this.lock = setTimeout(() => {
            if (this.lock !== true) this.lock = false
        }, this.speed * 1000)

        for (let i = 0; i < this.slideCount; i++) {
            let pos = (i + dir * this.slideCount - this.index) % this.slideCount
            let transition

            if (Math.abs(pos) <= 1) {
                transition = `left ${this.speed}s ease`
            } else {
                transition = 'left 0s'
            }

            pos -= dir
            this.slides[i].style.left = `${pos * 100}%`
            this.slides[i].style.transition = transition
        }

        this.updateIndex(dir)
        this.index %= this.slideCount
        this.updateNav()
    }

    goto(localIndex) {
        if (this.lock) {
            clearTimeout(this.lock)
            this.lock = setTimeout(() => {
                this.lock = false
                this.goto(localIndex)
            }, this.speed * 1000)
        }

        let dest = []
        const gap = localIndex - this.index
        if (gap === 0) return
        const offset = gap > 0 ? this.slideCount : -this.slideCount

        for (let i = 0; i < this.slideCount; i++) {
            let pos = (i + offset - this.index) % this.slideCount
            dest[i] = pos - gap
            let slide = this.slides[i]
            slide.style.transition = 'left 0s'
            slide.style.left = `${pos * 100}%`
        }

        const move = () => {
            for (let i = 0; i < this.slideCount; i++) {
                this.slides[i].style.left = `${dest[i] * 100}%`
                this.slides[i].style.transition = `left ${this.speed}s ease`
            }
        }

        setTimeout(move)

        this.resetTimer()
        this.lock = setTimeout(() => {
            this.recycle()
            this.lock = false
        }, this.speed * 1000)
        this.index = localIndex
        this.updateNav()
    }

    setTimer() {
        this.interval = setInterval(() => {
            this.slideLeft()
        }, this.duration * 1000)
    }

    resetTimer() {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
            setTimeout(() => this.setTimer(), this.interactTimeout * 1000)
        }
    }

    addNav() {
        const navContainer = document.createElement('div')
        navContainer.classList.add('carousel-nav')
        this.nav = []

        for (let i = 0; i < this.slideCount; i++) {
            this.nav[i] = document.createElement('span')
            let n = i
            this.nav[i].addEventListener('click', () => {
                this.goto(n)
            })
            navContainer.appendChild(this.nav[i])
        }

        this.carousel.appendChild(navContainer)
        this.updateNav()
    }

    updateNav() {
        for (let i = 0; i < this.slideCount; i++) {
            if (i === this.index) {
                this.nav[i].classList.add('active')
            } else {
                this.nav[i].classList.remove('active')
            }
        }
    }

    onTouchStart(event) {
        if (this.swipe || this.lock === true) return
        this.lock = true
        this.xStart = this.xLast = event.changedTouches[0].pageX
        this.yStart = event.changedTouches[0].pageY
        this.eStart = parseInt(this.container.style.left) || 0
        this.tLast = Date.now()
        this.velocity = 0
        this.swipe = 'pending'
    }

    onTouchMove(event) {
        if (
            !this.swipe ||
            (this.swipe === 'canceled') | (this.swipe === 'coasting')
        ) {
            return false
        }
        let curr = event.changedTouches[0]
        if (this.swipe === 'pending') {
            let dY = Math.abs(curr.pageY - this.yStart)
            let dX = Math.abs(curr.pageX - this.xStart)
            if (dY > dX * 4 || dY > 24) {
                this.swipe = 'canceled'
                this.lock = false
                return
            } else if (dX > dY * 3 || dX > 10) {
                this.swipe = 'active'
            } else {
                return
            }
        }
        event.preventDefault()
        let t = Date.now()
        let dT = t - this.tLast
        let localVelocity = dT ? (curr.pageX - this.xLast) / dT : 0
        this.tLast = t
        this.velocity = (2 * localVelocity + this.velocity) / 3
        this.velocity = Math.min(this.velocity, 10)
        this.xLast = curr.pageX
        this.delta = curr.pageX - this.xStart
        this.container.style.left = `${this.eStart + this.delta}px`
    }

    onTouchEnd() {
        if (this.swipe === 'coasting') {
            return
        }
        if (this.swipe === 'canceled') {
            this.swipe = null
            return
        }
        if (this.swipe === 'active') {
            this.swipe = 'coasting'
            setTimeout(this.inertia.bind(this))
        }
    }

    inertia() {
        let w = this.container.offsetWidth
        let gravity = 0
        let t = Date.now()
        let dT = t - this.tLast
        this.tLast = t

        if (this.delta < -w / 6) {
            gravity = -w
        } else if (this.delta > w / 6) {
            gravity = w
        }
        let g = gravity - this.delta

        this.velocity = g / 60
        this.delta += this.velocity * dT
        let pos = Math.floor(this.delta)
        this.container.style.left = `${pos}px`

        if (Math.abs(pos - gravity) > 2 || this.velocity > 0.1) {
            setTimeout(this.inertia.bind(this), 30)
        } else {
            if (gravity) {
                let dir = gravity > 0 ? -1 : 1
                this.updateIndex(dir)
                this.updateNav()
                this.recycle()
            }
            this.container.style.left = '0'
            this.resetTimer()
            this.swipe = null
            this.lock = false
        }
    }
}
