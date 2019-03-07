const Caro = (function () {
	let elem = null;
	const speed = .25;
	const duration = 2;
	const interactTimeout = 4;
	let id = null;
	let container = null;
	let slides = null;
	let prevBtn = null;
	let nextBtn = null;
	let index = 0;
	let count = null;
	let lock = false;
	let interval = null;
	let nav = null;
	let xStart;
	let xLast;
	let yStart;
	let eStart;
	let tLast;
	let swipe;
	let vel;

    function init (config) {
    	home = document.getElementById(config.home);
    	container = document.getElementById(config.container);
		slides = document.getElementsByClassName(config.slides);
    	prevBtn = document.getElementById(config.prev);
    	nextBtn = document.getElementById(config.next);
    	count = slides.length;
    	
    	nextBtn && nextBtn.addEventListener('click', () => {
    		slideLeft(index);
    		resetTimer();
    	}, false);
    
	    prevBtn && prevBtn.addEventListener('click', () => {
	    	slideRight(index);
	    	resetTimer();
	    }, false);
    
		container.addEventListener('touchstart', onTouchStart);
		container.addEventListener('touchmove', onTouchMove);
		container.addEventListener('touchend', onTouchEnd);
	
		addNav();
		setTimer();
    }
	
	function slideLeft () {
        cycle(1);
    }
    
    function slideRight () {
        cycle(-1);
    }
    
    function incdec (inc) {
    	console.log(index, count, inc);
        index = (index + count + inc) % count;
    }
    
    function recycle () {
        let ind = (index + Math.floor(count / 2)) % count;
        let pos = Math.floor(-count / 2);
        for (let i = 0; i < slides.length; i++) {
            /* slides[ind].setStyle({
                left: pos + "00%",
                transition: 'left 0s',
            }); */
            slides[ind].style.left = pos + '00%';
            slides[ind].style.transition = 'left 0s';
            pos++;
            ind = (ind + 1) % count;
        }
    }

    function cycle (dir) {
        if (lock || document.hidden) {
            return;
        }
        
        lock = setTimeout(function () {
        	const self = this;
            if (lock !== true) lock = false;
            //console.log(self);
        //}.bind(this), speed * 900);
        }, speed * 900);

        for (let i = 0; i < slides.length; i++) {
            let pos = (i + (dir * count) - index) % count;
            if (Math.abs(pos) <= 1) {
                transition = 'left ' + speed + 's ease';
            }
            else {
                transition = 'left 0s';
            }
            pos -= dir;
            //alert(pos);
            /* slides[i].setStyle({
                left: pos + "00%",
                transition: transition,
            }); */
            slides[i].style.left = pos + '00%';            
            slides[i].style.transition = transition;
        }
        incdec(dir);
        index %= count;
        updateNav();
    }
    
    function goto (localIndex) {
        if (lock) {
            clearTimeout(lock);
            lock = setTimeout(function () {
                lock = false;
                goto(localIndex);
            }.bind(this), speed * 1000);
        }
        let dest = [];
        const gap = localIndex - index;
        if (gap == 0) return;
        const offset = gap > 0 ? count : -count;
        for (let i = 0; i < slides.length; i++) {
            let pos = (i + offset - index) % count;
            dest[i] = pos - gap;
            let e = slides[i];
            //setStyle is prototype.js API
            /* e.setStyle({
                transition: 'left 0s',
                left: pos + "00%"
            }); */
            e.style.transition = 'left 0s';            
            e.style.left = pos + '00%';
        }
        
        const slide = function () {
            for (let i = 0; i < slides.length; i++) {
                /* slides[i].setStyle({
                    left: dest[i] + "00%",
                    transition: 'left ' + speed + 's ease'
                }); */
                slides[i].style.left = dest[i] + '00%';
                slides[i].style.transition = 'left ' + speed + 's ease';
            }
        }.bind(this);
        
        //is this doing something?
        /* (function () {
            slide.defer();
        }).defer(); */
        
        (function () {
        	setTimeout(slide, 0);
        }());
        
        resetTimer();
        lock = setTimeout(function () {
            recycle();
            lock = false;
        }.bind(this), speed * 1000);
        index = localIndex;
        updateNav();
    }
    
    function setTimer () {
        interval = setInterval(function () {
            slideLeft();
        }.bind(this), duration * 1000);
    }
    
    function resetTimer () {
        if (interval) {
            clearInterval(interval);
            interval = null;
            setTimeout(function () {
                setTimer();
            }.bind(this), interactTimeout * 1000);
        }
    }
    
    function addNav () {
    	//prototype.js api
        /* const navCnt = new Element('div', {
            'class': 'carousel-nav'
        }); */
        const navCnt = document.createElement('div');
        navCnt.setAttribute('class', 'carousel-nav');
		console.log(typeof navCnt);
        nav = [];
        for (let i = 0; i < count; i++) {
            //nav[i] = new Element('span');
            nav[i] = document.createElement('span');

            let n = i;
            //nav[i].addEventListener('click', goto.bind(this).curry(n));
            //curry() is prototype.js api
            //nav[i].addEventListener('click', goto.curry(n));
            nav[i].addEventListener('click', () => {
            	console.log('num', n);
            	goto(n);
            });
            navCnt.appendChild(nav[i]);
        }
        home.appendChild(navCnt);
        updateNav();
    }

    function updateNav () {
        for (let i = 0; i < count; i++) {
            if (i == index) {
                //nav[i].addClassName('active');
                nav[i].classList.add('active');
            }
            else {
                //nav[i].removeClassName('active');
                nav[i].classList.remove('active');
            }
        }
    }
    
    function onTouchStart (e) {
    	//alert('touch start 1');
    	//alert(swipe); //become 'pending' at second touch
        if (swipe || lock === true) return;
        //alert('touch start 2', swipe);
    	//alert(swipe);
        lock = true;
        xStart = xLast = e.changedTouches[0].pageX;
        yStart = e.changedTouches[0].pageY;
        eStart = parseInt(container.style.left) || 0;
        tLast = new Date().valueOf();
        vel = 0;
        swipe = 'pending';
    }

    function onTouchMove (e) {
        //alert('E1' + e);
        if (!swipe || swipe == 'canceled' || swipe == 'coasting') {
            return false;
        }
        //alert('E2' + e);
        let curr = e.changedTouches[0];
        //alert(curr);
        if (swipe == 'pending') {
            let dY = Math.abs(curr.pageY - yStart),
                dX = Math.abs(curr.pageX - xStart);
            if (dY > dX * 4 || dY > 24) {
                swipe = 'canceled';
                lock = false;
                return;
            }
            else if (dX > dY * 3 || dX > 10) {
                swipe = 'active';
            }
            else {
                return;
            }
            //alert(swipe);//active
        }
        e.preventDefault();
        let t = new Date().valueOf(),
            dT = t - tLast,
            localVel = dT ? (curr.pageX - xLast) / dT : 0;
        tLast = t;
        vel = (2 * localVel + vel) / 3;
        vel = Math.min(vel, 10);
        xLast = curr.pageX;
        delta = curr.pageX - xStart;
        container.style.left = eStart + delta + 'px';
    }

    function onTouchEnd (e) {
        if (swipe == 'coasting') {
            return;
        }
        if (swipe == 'canceled') {
            swipe = null;
            return;
        }
        if (swipe == 'active') {
            swipe = 'coasting';
            setTimeout(inertia.bind(this), 0);
        }
    }
    
    function inertia () {
        let w = container.offsetWidth,
            gravity = 0,
            t = new Date().valueOf(),
            dT = t - tLast;
        tLast = t;
        if (delta < -w / 6) {
            gravity = -w;
        }
        else if (delta > w / 6) {
            gravity = w;
        }
        let g = gravity - delta;
        let dist = Math.abs(g);
        let dir = dist ? g / dist : 0;
        let accel;
        if (false && dist > 20) { // Gravity doesn't hold a candle to a simple ease-in,
            accel = dT / (2 * dir * Math.sqrt(dist));
            vel += accel;
            vel *= 0.6;
        }
        else {
            vel = g / 60;
        }
        delta += vel * dT;
        let pos = Math.floor(delta);
        container.style.left = pos + 'px';
        if (Math.abs(pos - gravity) > 2 || vel > 0.1) {
            setTimeout(inertia.bind(this), 30);
        }
        else {
            if (gravity) {
                let dir = gravity > 0 ? -1 : 1;
                incdec(dir);
                updateNav();
                recycle();
            }
            container.style.left = '0';
            resetTimer();
            swipe = null;
            lock = false;
        }
    }
    
    return {
    	init
    };
    
}());