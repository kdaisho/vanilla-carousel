_Mh = window._Mh || {};
Object.extend(_Mh, {
    __listeners: {},
    i18n: function (str) {
        return this.__translate[str] || str;
    },
    Base: Class.create({
        // __listeners: null,
        initialize: function (config) {
            config = config || {};
            console.log(config);
            this.__listeners = {};
            // if (config['listeners']) {
            //     for (e in config.listeners) {
            //         if (config.listeners.hasOwnProperty(e)) {
            //             this.addListener(e, config.listeners[e].bind(this));
            //         }
            //     }
            // }
            for (m in config) {
                if (config.hasOwnProperty(m) && typeof this['_' + m] != 'undefined') {
                    this['_' + m] = config[m];
                    console.log('m?', m);
                    console.log('haha', this['_' + m] = config[m]);
                }
            }
        },
        // fireEvent: function (e, params) {
        //     var listeners = this.__listeners[e] || [];

        //     if (_Mh.__listeners[e]) {
        //         listeners = listeners.concat(_Mh.__listeners[e]);
        //     }
        //     if (listeners.length) {
        //         params = params || {};
        //         params._obj = this;
        //         params._event = e;
        //         // TODO add a devmode hook so that we don't miss exceptions on synchronous events.
        //         for (var i = 0; i < listeners.length; i++) {
        //             if (!listeners[i]) {
        //                 continue; // handler has been removed
        //             }
        //             if (params['async']) {
        //                 listeners[i].defer(params);
        //             }
        //             else {
        //                 try {
        //                     listeners[i](params);
        //                 } catch (e) {
        //                     // NOOP
        //                 }
        //             }
        //         }
        //     }
        // },
        // addListener: function (e, fn) {
        //     if (!this.__listeners[e]) {
        //         this.__listeners[e] = [];
        //     }
        //     var index = this.__listeners[e].length;
        //     this.__listeners[e].push(fn);
        //     return e + '@' + index;
        // },
        // removeListener: function (id) {
        //     var eh = id.split('@');
        //     if (eh.length != 2 || !/^[1-9]\d*$/.match(eh[1])) {
        //         return;
        //     }
        //     // This is going to suck if the page lifecycle is very long, but it's simple and quick if it isn't.
        //     this.__listeners[eh[0]][eh[1]] = null;
        // },
        // post: function (url, params) {
        //     var f = new Element('form', {
        //         action: url
        //     });
        //     for (p in params) {
        //         var i = new Element('input', {
        //             name: p
        //         });
        //         i.value = params[p];
        //         f.appendChild(i);
        //     }
        //     document.body.appendChild(f);
        //     f.submit();
        // }
    }),
    // addListener: function (e, fn) {
    //     if (!this.__listeners[e]) {
    //         this.__listeners[e] = [];
    //     }
    //     var index = this.__listeners[e].length;
    //     this.__listeners[e].push(fn);
    //     return e + '@' + index;
    // },
    // removeListener: function (id) {
    //     var eh = id.split('@');
    //     if (eh.length != 2 || !/^[1-9]\d*$/.match(eh[1])) {
    //         return;
    //     }
    //     // This is going to suck if the page lifecycle is very long, but it's simple and quick if it isn't.
    //     this.__listeners[eh[0]][eh[1]] = null;
    // },
    // _purge: function (d) {
    //     var a = d.attributes,
    //         i, l, n;
    //     if (a) {
    //         for (i = a.length - 1; i >= 0; i -= 1) {
    //             n = a[i].name;
    //             if (typeof d[n] === 'function') {
    //                 d[n] = null;
    //             }
    //         }
    //     }
    //     a = d.childNodes;
    //     if (a) {
    //         l = a.length;
    //         for (i = 0; i < l; i += 1) {
    //             _Mh._purge(d.childNodes[i]);
    //         }
    //     }
    // },
    // _analytics: function (data) {
    //     _gaq = _gaq || [];
    //     _gaq.push(data);
    // },
    // getCookie: function (name) {
    //     return Mage.Cookies.get(name);
    // },
    // setCookie: function (name, value, duration) {
    //     return Mage.Cookies.set(name, value, new Date(new Date().valueOf + duration * 1000));
    // }
});
