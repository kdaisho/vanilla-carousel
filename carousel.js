// No-clone carousel: every slide is absolutely positioned and translated by a
// whole number of slide widths relative to the current one. Only slides that
// are on screen during a move are animated; the rest jump while off-screen.

const mod = (a, n) => ((a % n) + n) % n

/**
 * Where slide `i` sits, in slide widths, when `index` is the current slide.
 * -1 = previous, 0 = current, 1 = next. Range: [-floor(n/2), ceil(n/2) - 1].
 */
export const slideOffset = (i, index, n) => {
    const half = Math.floor(n / 2)
    return mod(i - index + half, n) - half
}

/**
 * Signed number of steps for the shortest way from `from` to `to` around the
 * loop. Ties (even n, exactly half way) go forward.
 */
export const shortestSteps = (from, to, n) => {
    const d = slideOffset(to, from, n)
    return n % 2 === 0 && d === -n / 2 ? n / 2 : d
}

const tx = widths => `translateX(${widths * 100}%)`
const txPx = px => `translateX(${px}px)`

const DEFAULTS = {
    speed: 0.25, // seconds per move
    duration: 3, // seconds between autoplay moves
    interactTimeout: 4, // seconds of no interaction before autoplay resumes
    autoplay: true,
    pauseOnHover: true,
    arrows: true,
    trackSelector: '.container',
    slideSelector: '.slide',
}

class Autoplay {
    #interval = null
    #resume = null
    #holds = new Set()

    constructor(tick, options) {
        this.tick = tick
        this.options = options
    }

    get running() {
        return this.#interval !== null
    }

    start() {
        if (!this.options.autoplay || this.#holds.size || this.#interval) return
        this.#interval = setInterval(this.tick, this.options.duration * 1000)
    }

    stop() {
        clearInterval(this.#interval)
        clearTimeout(this.#resume)
        this.#interval = this.#resume = null
    }

    // Call on every user interaction: autoplay resumes `interactTimeout`
    // seconds after the last one.
    bump() {
        this.stop()
        if (!this.options.autoplay) return
        this.#resume = setTimeout(() => {
            this.#resume = null
            this.start()
        }, this.options.interactTimeout * 1000)
    }

    hold(reason) {
        this.#holds.add(reason)
        clearInterval(this.#interval)
        this.#interval = null
    }

    release(reason) {
        this.#holds.delete(reason)
        if (!this.#resume) this.start()
    }
}

class Dots {
    constructor(count, onSelect, signal) {
        this.el = document.createElement('div')
        this.el.classList.add('carousel-nav')
        this.buttons = Array.from({ length: count }, (_, i) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.setAttribute('aria-label', `Go to slide ${i + 1}`)
            button.addEventListener('click', () => onSelect(i), { signal })
            this.el.appendChild(button)
            return button
        })
    }

    update(index) {
        this.buttons.forEach((button, i) => {
            button.classList.toggle('active', i === index)
            button.setAttribute('aria-current', String(i === index))
        })
    }
}

export class Carousel {
    // 'idle' | 'animating' | 'pressed' | 'dragging' | 'settling' | 'destroyed'
    #state = 'idle'
    #queued = 0 // steps requested while animating
    #animations = []
    #drag = null
    #abort = new AbortController()
    #created = []
    #autoplay
    #dots

    constructor(root, options = {}) {
        if (!root) throw new Error('Carousel: root element is required')
        this.root = root
        this.options = { ...DEFAULTS, ...options }
        this.track = root.querySelector(this.options.trackSelector)
        if (!this.track) {
            throw new Error(`Carousel: no ${this.options.trackSelector} in root`)
        }
        this.slides = [...this.track.querySelectorAll(this.options.slideSelector)]
        this.count = this.slides.length
        this.index = 0
        if (!this.count) throw new Error('Carousel: no slides found')

        this.#layout()
        if (this.count < 2) return

        const signal = this.#abort.signal

        if (this.options.arrows) {
            this.#addButton('is-prev', 'Previous slide', () => this.prev())
            this.#addButton('is-next', 'Next slide', () => this.next())
        }

        this.#dots = new Dots(this.count, i => this.#interact(() => this.goTo(i)), signal)
        this.#dots.update(this.index)
        root.appendChild(this.#dots.el)
        this.#created.push(this.#dots.el)

        this.#autoplay = new Autoplay(() => {
            if (this.#state === 'idle') this.#move(1)
        }, this.options)

        if (this.options.pauseOnHover) {
            root.addEventListener('pointerenter', e => e.pointerType === 'mouse' && this.#autoplay.hold('hover'), { signal })
            root.addEventListener('pointerleave', e => e.pointerType === 'mouse' && this.#autoplay.release('hover'), { signal })
        }
        document.addEventListener(
            'visibilitychange',
            () => (document.hidden ? this.#autoplay.hold('hidden') : this.#autoplay.release('hidden')),
            { signal }
        )

        root.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.#interact(() => this.prev())
            if (e.key === 'ArrowRight') this.#interact(() => this.next())
        }, { signal })

        this.track.addEventListener('pointerdown', e => this.#onDown(e), { signal })
        this.track.addEventListener('pointermove', e => this.#onMove(e), { signal })
        this.track.addEventListener('pointerup', e => this.#onUp(e), { signal })
        this.track.addEventListener('pointercancel', e => this.#onUp(e), { signal })
        // A press that leaves the track before it becomes a drag never gets
        // its pointerup here.
        this.track.addEventListener('pointerleave', e => this.#state === 'pressed' && this.#onUp(e), { signal })
        this.track.addEventListener('dragstart', e => e.preventDefault(), { signal })

        if (document.hidden) this.#autoplay.hold('hidden')
        this.#autoplay.start()
    }

    get state() {
        return this.#state
    }

    next() {
        this.#request(1)
    }

    prev() {
        this.#request(-1)
    }

    goTo(target) {
        const to = mod(target, this.count)
        // While animating, `index` is already the slide being moved to.
        this.#request(shortestSteps(this.index, to, this.count) - (this.#state === 'animating' ? this.#queued : 0))
    }

    destroy() {
        this.#state = 'destroyed'
        this.#abort.abort()
        this.#autoplay?.stop()
        this.#animations.forEach(a => a.cancel())
        this.#created.forEach(el => el.remove())
        this.slides.forEach(s => (s.style.transform = ''))
        this.track.style.transform = ''
        this.track.classList.remove('grabbing')
    }

    // --- moves ---------------------------------------------------------------

    #interact(fn) {
        fn()
        this.#autoplay?.bump()
    }

    #addButton(className, label, onClick) {
        const button = document.createElement('button')
        button.type = 'button'
        button.classList.add(className)
        button.setAttribute('aria-label', label)
        button.addEventListener('click', () => this.#interact(onClick), { signal: this.#abort.signal })
        this.root.appendChild(button)
        this.#created.push(button)
    }

    #request(steps) {
        if (this.count < 2 || !steps) return
        if (this.#state === 'animating') {
            this.#queued += steps
        } else if (this.#state === 'idle' || this.#state === 'pressed') {
            this.#drag = null
            this.#move(steps)
        }
        // 'dragging' / 'settling': the user's finger wins, ignore.
    }

    get #reducedMotion() {
        return matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    #layout() {
        this.slides.forEach((slide, i) => {
            slide.style.transform = tx(slideOffset(i, this.index, this.count))
        })
    }

    #move(steps) {
        const n = this.count
        // A strip of more than n slides would reuse one; take the short way.
        if (Math.abs(steps) >= n) steps = shortestSteps(this.index, mod(this.index + steps, n), n)
        if (!steps) return this.#settled()

        const from = this.index
        const dir = Math.sign(steps)
        this.index = mod(from + steps, n)
        this.#state = 'animating'
        this.#dots.update(this.index)

        // Resting positions for the new index. Slides outside the strip below
        // stay here: they are all off-screen.
        this.#layout()

        // The strip: the current slide, the target and everything between.
        // Each animation has an explicit start frame, so the browser cannot
        // merge it with the previous position.
        const duration = this.#reducedMotion ? 0 : this.options.speed * 1000
        this.#animations = []
        for (let k = 0; k <= Math.abs(steps); k++) {
            const slide = this.slides[mod(from + dir * k, n)]
            const start = dir * k
            this.#animations.push(
                slide.animate([{ transform: tx(start) }, { transform: tx(start - steps) }], {
                    duration,
                    easing: 'ease',
                })
            )
        }

        Promise.all(this.#animations.map(a => a.finished)).then(
            () => this.#settled(),
            () => {} // cancelled by destroy()
        )
    }

    #settled() {
        if (this.#state === 'destroyed') return
        this.#animations = []
        this.#state = 'idle'
        const queued = this.#queued
        this.#queued = 0
        if (queued) this.#move(queued)
    }

    // --- drag ----------------------------------------------------------------

    #onDown(e) {
        if (this.#state !== 'idle' || !e.isPrimary || e.button !== 0) return
        this.#state = 'pressed'
        this.#drag = {
            id: e.pointerId,
            x0: e.clientX,
            y0: e.clientY,
            x: e.clientX,
            t: e.timeStamp,
            v: 0, // px per ms
            delta: 0,
            w: this.track.offsetWidth,
        }
    }

    #onMove(e) {
        const d = this.#drag
        if (!d || e.pointerId !== d.id) return

        if (this.#state === 'pressed') {
            const dx = Math.abs(e.clientX - d.x0)
            const dy = Math.abs(e.clientY - d.y0)
            if (dy > 10 && dy > dx) {
                // Vertical gesture: not ours. (On touch the browser scrolls
                // thanks to `touch-action: pan-y` and sends pointercancel.)
                this.#state = 'idle'
                this.#drag = null
                return
            }
            if (dx < 8) return
            this.#state = 'dragging'
            this.track.setPointerCapture(e.pointerId)
            this.track.classList.add('grabbing')
            this.#autoplay.hold('drag')
        }
        if (this.#state !== 'dragging') return

        const dt = e.timeStamp - d.t
        if (dt > 0) d.v = (2 * ((e.clientX - d.x) / dt) + d.v) / 3
        d.x = e.clientX
        d.t = e.timeStamp
        d.delta = e.clientX - d.x0

        if (this.count === 2) {
            // Previous and next are the same slide: put it on the side being
            // revealed.
            const other = this.slides[mod(this.index + 1, 2)]
            other.style.transform = tx(d.delta > 0 ? -1 : 1)
        }
        this.track.style.transform = txPx(d.delta)
    }

    #onUp(e) {
        const d = this.#drag
        if (!d || e.pointerId !== d.id) return
        if (this.#state === 'pressed') {
            this.#state = 'idle'
            this.#drag = null
            return
        }
        if (this.#state !== 'dragging') return

        this.track.classList.remove('grabbing')
        if (this.track.hasPointerCapture(d.id)) this.track.releasePointerCapture(d.id)
        this.#autoplay.release('drag')
        this.#settle(e.type === 'pointercancel')
    }

    #settle(cancelled) {
        const { delta, v, w } = this.#drag
        this.#drag = null
        this.#state = 'settling'

        // A fast flick counts even if it is short.
        const flick = Math.abs(v) > 0.4 && Math.sign(v) === Math.sign(delta)
        let dir = 0
        if (!cancelled && (Math.abs(delta) > w / 6 || flick)) dir = delta < 0 ? 1 : -1

        const target = -dir * w
        const base = this.options.speed * 1000
        const pxPerMs = Math.max(Math.abs(v), w / base)
        const duration = this.#reducedMotion ? 0 : Math.min(base, Math.abs(target - delta) / pxPerMs)

        if (dir) {
            this.index = mod(this.index + dir, this.count)
            this.#dots.update(this.index)
        }

        this.track.style.transform = txPx(target)
        const glide = this.track.animate([{ transform: txPx(delta) }, { transform: txPx(target) }], {
            duration,
            easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
        })
        this.#animations = [glide]
        glide.finished.then(
            () => {
                // Same task as the glide's last frame: no flicker.
                this.track.style.transform = ''
                this.#layout()
                this.#animations = []
                this.#state = 'idle'
                this.#autoplay.bump()
            },
            () => {}
        )
    }
}
