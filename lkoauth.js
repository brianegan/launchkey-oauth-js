/**
 * LaunchKey JavaScript Library for OAuth
 * Version 1.1.0
 * https://launchkey.com
 * Copyright 2013 LaunchKey, Inc.
 * Date Updated: 2013-11-23
 */

(function(win, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory();
        });
    }
    else {
        win.LaunchKey = factory();
    }
}(window, function() {
    var OAUTH_ENDPOINT = 'https://oauth.launchkey.com/',
        doc = document,
        win = window;

    /**
     * @private
     * Writes a cookie with a given name and value.
     *
     * @param {String} name The name of the cookie to set
     * @param {String} value The value of the cookie being set
     * @param {Number=} hours The time until the cookie will expire in hours
     * @param {String=} domain The domain on which to set the cookie.
     * @param {String=} path The path on which to set the cookie.
     *
     * @return {undefined}
     */
    function setCookie(name, value, hours, domain, path) {
        var expires = '',
            date = new Date();

        hours = typeof hours === 'number' ? hours : 1;
        domain = domain && domain !== '' ? '; domain=' + domain : '';
        path = path && path !== '' ? '; path=' + path : '; path=/';

        if (hours) {
            date.setTime(Date.now() + (hours * 3600000));
            expires = '; expires=' + date.toUTCString();
        }

        doc.cookie = name + '=' + value + expires + path + domain;
    }

    /**
     * @private
     * Returns the value of a given cookie.
     *
     * @param  {String} name The name of the cookie to read
     *
     * @return {String|Undefined} The value of the requested cookie
     */
    function getCookie(name) {
        var cookie = doc.cookie.split(name + '=')[1];

        if (cookie) {
            cookie = cookie.split(';')[0];
        }

        return cookie;
    }

    /**
    * @private
    * Deletes a given cookie
    * @param  {String} name The cookie to delete
    *
    * @return {undefined}
    */
    function deleteCookie(name) {
        setCookie(name, '', -1);
    }

    /**
     * @private
     * Framework independent function to load CSS
     * @param path To the CSS file
     *
     * @returns {HTMLElement}
     */
    function loadStyleSheet(path) {
       var head = doc.getElementsByTagName('head')[0],
           link = doc.createElement('link');

       link.setAttribute('id', 'cssLKLoad');
       link.setAttribute('href', path);
       link.setAttribute('rel', 'stylesheet');
       link.setAttribute('type', 'text/css');

       return head.appendChild(link);
    }

    /**
     * @private
     * Gets the oAuth parameters
     */
    function getParams() {
        var params = {},
            queryString = location.hash.substring(1),
            regex = /([^&=]+)=([^&]*)/g,
            match;

        while (match = regex.exec(queryString)) {
            params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        }

        return params;
    }

    /**
    * @public
    * Logs the user out of their current session
    * @param {Object} options The options available to the customer
    * @param {Boolean=} options.reload Whether or not to reload the page after logout
    * @param {Function=} options.callback A callback function to be fired after logout is successful
    *
    * @return {undefined}
    */
    function logout(options) {
        var accessToken = getCookie('LKlogin'),
            reload = options.hasOwnProperty('reload') ? options.reload : true,
            callback = options.callback && typeof options.callback === 'function' ? options.callback : undefined;

        win.open(OAUTH_ENDPOINT + 'logout?close=true&access_token=' + accessToken, 'LaunchKey OAuth logout','height=200,width=150').blur();
        win.focus();

        deleteCookie('LKlogin');
        deleteCookie('LKuser');

        if (reload) {
            doc.location.reload(true);
        }

        if (callback) {
            callback();
        }
    }

    /**
     * @public
     * Add the LaunchKey button to your page.
     *
     * @param {Object} options The options available to the customer
     * @param {Number=} options.appKey The unique key for your application. No default.
     * @param {String=} options.size The size of the icon. Default is "large"
     * @param {String=} options.length Text length. Default is "full" for "Log in with LaunchKey". "Log in" is "short" and no text for "mini"
     * @param {String=} options.color The color of the button. Default is "blue". "light" and "dark" supported
     * @param {String=} options.el The element you want to turn into a LaunchKey button. Default is an element with the id="lkLoginButton"
     * @param {String=} options.redirectUrl Where the customer should go once logged in. Default is the current page
     *
     * @return {undefined}
     */
    function init(options) {
        var state = getCookie('LKstate'),
            params = getParams(),

            // Options
            size = options.size ? options.size.toLowerCase() : 'large',
            length = options.length ? options.length.toLowerCase() : 'full',
            color = options.color ? options.color.toLowerCase() : 'blue',
            el = options.el || doc.getElementById('lkLoginButton'),

            defaultRedirectUrl = encodeURIComponent(location.protocol + '//' + location.host + win.location.pathname),
            redirectUrl = options.redirectUrl ? encodeURIComponent(options.redirectUrl) : defaultRedirectUrl;

    if (params.state === state) {
        // The setCookie function is expecting the expire time in hours, but if this is returning seconds stuff could get weird
        setCookie('LKlogin', params.access_token, params.expires_in);
        setCookie('LKuser', params.user_id, params.expires_in);
    }

    state = Math.max(0.01, Math.random()).toString(36).slice(2);

    // Should this time to expire be configurable?
    setCookie('LKstate', state, 1);

    // Appending the button could be optional
    if (el) {
        el.innerHTML = '<a id="lkButton" href="' + OAUTH_ENDPOINT + 'authorize?client_id=' + encodeURIComponent(options.appKey.toString()) + '&redirect_uri=' + redirectUrl + '&response_type=token&scope=&state=' + encodeURIComponent(state) + '" class="lkloginbtn ' + length + ' ' + color + ' ' + size + '"><span class="icon"></span></a>';
        var cssLoad = 'cssLKLoad';
        if (!doc.getElementById(cssLoad)) {
            loadStyleSheet('https://launchkey.com/stylesheets/buttons.css');
        }
        if (length === 'short') {
            doc.getElementById('lkButton').innerHTML += '<span class="text">Log in</span>';
        }
        else if (length === 'full') {
            doc.getElementById('lkButton').innerHTML += '<span class="text">Log in with LaunchKey</span>';
        }
    }
  }

  return {
      init: init,
      logout: logout
  };
}));
