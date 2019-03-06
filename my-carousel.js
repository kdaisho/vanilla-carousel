const Caro = (function () {
	const elem,
		speed = .25;
		duration = 2;
		interactTimeout = 4,
		id = null,
		container = null,
		slides = null,
		prevBtn = null,
		nextBtn = null,
		index = 0,
		count = null,
		lock = false,
		interval = null,
		nav = null,
    function init (elementId) {
    	elem = document.getElementById(elementId);
    	console.log(elem);
    }
    
    return {
    	init
    };
    
}());