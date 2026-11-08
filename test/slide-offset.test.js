import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slideOffset, shortestSteps } from '../carousel.js'

const sizes = [1, 2, 3, 4, 5, 6, 9]

test('current slide is at 0, neighbours at -1 and +1', () => {
    for (const n of sizes.filter(n => n >= 3)) {
        for (let index = 0; index < n; index++) {
            assert.equal(slideOffset(index, index, n), 0)
            assert.equal(slideOffset((index + 1) % n, index, n), 1)
            assert.equal(slideOffset((index - 1 + n) % n, index, n), -1)
        }
    }
})

test('every slide gets a distinct offset in range', () => {
    for (const n of sizes) {
        const lo = -Math.floor(n / 2)
        const hi = Math.ceil(n / 2) - 1
        for (let index = 0; index < n; index++) {
            const offsets = Array.from({ length: n }, (_, i) => slideOffset(i, index, n))
            assert.equal(new Set(offsets).size, n)
            for (const o of offsets) assert.ok(o >= lo && o <= hi, `n=${n} offset ${o}`)
        }
    }
})

test('shortestSteps takes the short way around', () => {
    assert.equal(shortestSteps(0, 2, 3), -1) // 0 -> 2 of 3 goes back one
    assert.equal(shortestSteps(2, 0, 3), 1)
    assert.equal(shortestSteps(0, 2, 5), 2)
    assert.equal(shortestSteps(0, 3, 5), -2)
    assert.equal(shortestSteps(0, 2, 4), 2) // tie goes forward
    assert.equal(shortestSteps(0, 1, 2), 1)
    assert.equal(shortestSteps(1, 0, 2), 1)
    assert.equal(shortestSteps(3, 3, 5), 0)
    for (const n of sizes) {
        for (let a = 0; a < n; a++) {
            for (let b = 0; b < n; b++) {
                const s = shortestSteps(a, b, n)
                assert.equal((((a + s) % n) + n) % n, b)
                assert.ok(Math.abs(s) <= n / 2)
            }
        }
    }
})
