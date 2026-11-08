# vanilla-carousel

demo: https://kdaisho.github.io/vanilla-carousel/

A dependency-free looping carousel. Slides are never cloned: each one is
translated relative to the current slide, and only the slides on screen during
a move are animated.

```html
<section id="carousel" class="carousel">
    <div class="container">
        <div class="slide">One</div>
        <div class="slide">Two</div>
        <div class="slide">Three</div>
    </div>
</section>

<script type="module">
    import { Carousel } from './carousel.js'

    const carousel = new Carousel(document.getElementById('carousel'), {
        speed: 0.25, // seconds per move
        duration: 3, // seconds between autoplay moves
        interactTimeout: 4, // seconds after the last interaction before autoplay resumes
        autoplay: true,
        pauseOnHover: true,
        arrows: true,
    })

    carousel.next()
    carousel.prev()
    carousel.goTo(2) // takes the shortest way around
    carousel.destroy() // removes listeners, timers and generated buttons
</script>
```

Run the tests with `pnpm test`. Old versions live in `legacy/`.
