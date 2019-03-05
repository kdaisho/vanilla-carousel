/**
 * Simple carousel/slideshow
 */
_Mh.Carousel = Class.create(_Mh.Base, {
    _elem: null,
    _speed: 0.65,
    _duration: 5,
    _interactTimeout: 4,
    _analytics: false,
    __id: null,
    __container: null,
    __slides: null,
    __prevBtn: null,
    __nextBtn: null,
    __index: 0,
    __count: null,
    __lock: false,
    __interval: null,
    __nav: null,
    initialize: function ($super, config) {
        console.log(config);
        $super(config);
        console.log($super(config));
        this.__container = this._elem.querySelector(".carousel");
        this.__slides = this._elem.querySelectorAll(".slide");
        this.__prevBtn = this._elem.querySelector(".slide-prev");
        this.__nextBtn = this._elem.querySelector(".slide-next");
        this.__index = 0;
        this.__count = this.__slides.length;
        this.__name = 'carousel' + (this.__id ? ('-' + this.__id) : '');
        var _this = this;
        this.__nextBtn && this.__nextBtn.observe("click", function () {
            _this._slideLeft(_this.__index);
            if (_this._analytics) {
                _Mh._analytics(['_trackEvent', _this.__name, 'navigate', 'right']);
            }
            _this.__resetTimer();
        });
        this.__prevBtn && this.__prevBtn.observe("click", function () {
            _this._slideRight(_this.__index);
            if (_this._analytics) {
                _Mh._analytics(['_trackEvent', _this.__name, 'navigate', 'left']);
            }
            _this.__resetTimer();
        });
        this.__container.observe('touchstart', this.__onTouchStart.bind(this));
        this.__container.observe('touchmove', this.__onTouchMove.bind(this));
        this.__container.observe('touchend', this.__onTouchEnd.bind(this));

        this.__addNav();
        this.__setTimer();
        if (this._analytics) {
            this.__addLinkEvents();
        }
    },
    _slideLeft: function () {
        this.__cycle(1);
    },
    _slideRight: function () {
        this.__cycle(-1);
    },
    __incdec: function (inc) { // Stay positive!
        this.__index = (this.__index + this.__count + inc) % this.__count;
    },
    __recycle: function () {
        var ind = (this.__index + Math.floor(this.__count / 2)) % this.__count,
            pos = Math.floor(-this.__count / 2);
        for (var i = 0; i < this.__slides.length; i++) {
            this.__slides[ind].setStyle({
                left: pos + "00%",
                transition: 'left 0s',
            });
            pos++;
            ind = (ind + 1) % this.__count;
        }
    },
    __cycle: function (dir) {
        if (this.__lock || document.hidden) {
            return;
        }
        this.__lock = setTimeout(function () {
            if (this.__lock !== true) this.__lock = false;
        }.bind(this), this._speed * 900);
        for (var i = 0; i < this.__slides.length; i++) {
            var pos = (i + (dir * this.__count) - this.__index) % this.__count;
            if (Math.abs(pos) <= 1) {
                transition = 'left ' + this._speed + 's ease';
            }
            else {
                transition = 'left 0s';
            }
            pos -= dir;
            this.__slides[i].setStyle({
                left: pos + "00%",
                transition: transition,
            });
        }
        this.__incdec(dir);
        this.__index %= this.__count;
        this.__updateNav();
    },
    __goto: function (index) {
        if (this.__lock) {
            clearTimeout(this.__lock);
            this.__lock = setTimeout(function () {
                this.__lock = false;
                this.__goto(index);
            }.bind(this), this._speed * 1000);
        }
        var dest = [];
        var gap = index - this.__index;
        if (gap == 0)
            return;
        var offset = gap > 0 ? this.__count : -this.__count;
        for (var i = 0; i < this.__slides.length; i++) {
            var pos = (i + offset - this.__index) % this.__count;
            dest[i] = pos - gap;
            var e = this.__slides[i];
            e.setStyle({
                transition: 'left 0s',
                left: pos + "00%"
            });
        }
        // NB I tried many different methods to get the style updates to synchronize (on FF) here before
        // I finally settled on the awkward solution of nested defers. Transition events are quirky and inconsistent,
        // and though I never found the part of the spec that says so, they don't seem to fire if the transition
        // time is set to 0. This makes it very, very difficult to do what we're doing here in first applying
        // an immediate position change, and then applying onother position change with a transition "once it's finished".
        // It the "once it's finished" part which is problematic.
        // Anyway, if you think it looks derpy, you're right. If you want to fix it: You've been warned.
        // PS I've considered the possibility that prototype is updating the styles asynchronously, which could account
        // for the weirdness. If this is the case, then we could get rid of one of the defers by updating the styles 'manually',
        // but it's a negligible win, and will do nothing to make the code cleaner.
        var slide = function () {
            for (var i = 0; i < this.__slides.length; i++) {
                this.__slides[i].setStyle({
                    left: dest[i] + "00%",
                    transition: 'left ' + this._speed + 's ease'
                });
            }
        }.bind(this);
        (function () {
            slide.defer();
        }).defer();
        this.__resetTimer();
        this.__lock = setTimeout(function () {
            this.__recycle();
            this.__lock = false;
        }.bind(this), this._speed * 1000);
        this.__index = index;
        this.__updateNav();
        if (this._analytics) {
            _Mh._analytics(['_trackEvent', this.__name, 'navigate', 'spot-' + index]);
        }
    },
    __setTimer: function () {
        this.__interval = setInterval(function () {
            this._slideLeft();
        }.bind(this), this._duration * 1000);
    },
    __resetTimer: function () {
        if (this.__interval) {
            clearInterval(this.__interval);
            this.__interval = null;
            setTimeout(function () {
                this.__setTimer();
            }.bind(this), this._interactTimeout * 1000);
        }
    },
    __addNav: function () {
        var navCnt = new Element('div', {
            'class': 'carousel-nav'
        });
        this.__nav = [];
        for (var i = 0; i < this.__count; i++) {
            this.__nav[i] = new Element('span');
            var n = i;
            this.__nav[i].observe('click', this.__goto.bind(this).curry(n));
            navCnt.appendChild(this.__nav[i]);
        }
        this._elem.appendChild(navCnt);
        this.__updateNav();
    },
    __addLinkEvents: function () {
        var _this = this;
        $$('.carousel-link').each(function (el) {
            el.slideId = el.dataset ? el.dataset.id : el.getAttribute('data-id');
            el.observe('click', function (e) {
                _Mh._analytics(['_trackEvent', _this.__name, 'click', 'carousel-slide-' + el.slideId]);
            });
        });
    },
    __updateNav: function () {
        for (var i = 0; i < this.__count; i++) {
            if (i == this.__index) {
                this.__nav[i].addClassName('active');
            }
            else {
                this.__nav[i].removeClassName('active');
            }
        }
    },
    __onTouchStart: function (e) {
        if (this.__swipe || this.__lock === true)
            return;
        this.__lock = true;
        this.__xStart = this.__xLast = e.changedTouches[0].pageX;
        this.__yStart = e.changedTouches[0].pageY;
        this.__eStart = parseInt(this.__container.style.left) || 0;
        this.__tLast = new Date().valueOf();
        this.__vel = 0;
        this.__swipe = 'pending';
    },
    __onTouchMove: function (e) {
        if (!this.__swipe || this.__swipe == 'canceled' || this.__swipe == 'coasting') {
            return false;
        }
        var curr = e.changedTouches[0];
        if (this.__swipe == 'pending') {
            var dY = Math.abs(curr.pageY - this.__yStart),
                dX = Math.abs(curr.pageX - this.__xStart);
            if (dY > dX * 4 || dY > 24) {
                this.__swipe = 'canceled';
                this.__lock = false;
                return;
            }
            else if (dX > dY * 3 || dX > 10) {
                this.__swipe = 'active';
            }
            else {
                return;
            }
        }
        e.preventDefault();
        var t = new Date().valueOf(),
            dT = t - this.__tLast,
            vel = dT ? (curr.pageX - this.__xLast) / dT : 0;
        this.__tLast = t;
        this.__vel = (2 * vel + this.__vel) / 3;
        this.__vel = Math.min(this.__vel, 10);
        this.__xLast = curr.pageX;
        this.__delta = curr.pageX - this.__xStart;
        this.__container.style.left = this.__eStart + this.__delta + 'px';

    },
    __onTouchEnd: function (e) {
        if (this.__swipe == 'coasting') {
            return;
        }
        if (this.__swipe == 'canceled') {
            this.__swipe = null;
            return;
        }
        if (this.__swipe == 'active') {
            this.__swipe = 'coasting';
            setTimeout(this.__inertia.bind(this), 0);
        }
        if (this._analytics) {
            if (this.__vel > 0) {
                _Mh._analytics(['_trackEvent', this.__name, 'navigate', 'swipe-left']);
            }
            else {
                _Mh._analytics(['_trackEvent', this.__name, 'navigate', 'swipe-right']);
            }
        }
    },
    __inertia: function () {
        var w = this.__container.offsetWidth,
            gravity = 0,
            t = new Date().valueOf(),
            dT = t - this.__tLast;
        this.__tLast = t;
        if (this.__delta < -w / 6) {
            gravity = -w;
        }
        else if (this.__delta > w / 6) {
            gravity = w;
        }
        var g = gravity - this.__delta,
            dist = Math.abs(g),
            dir = dist ? g / dist : 0,
            accel;
        if (false && dist > 20) { // Gravity doesn't hold a candle to a simple ease-in,
            accel = dT / (2 * dir * Math.sqrt(dist));
            this.__vel += accel;
            this.__vel *= 0.6;
        }
        else {
            this.__vel = g / 60;
        }
        this.__delta += this.__vel * dT;
        var pos = Math.floor(this.__delta);
        this.__container.style.left = pos + 'px';
        if (Math.abs(pos - gravity) > 2 || this.__vel > 0.1) {
            setTimeout(this.__inertia.bind(this), 30);
        }
        else {
            if (gravity) {
                var dir = gravity > 0 ? -1 : 1;
                this.__incdec(dir);
                this.__updateNav();
                this.__recycle();
            }
            this.__container.style.left = '0';
            this.__resetTimer();
            this.__swipe = null;
            this.__lock = false;
        }
    }
});