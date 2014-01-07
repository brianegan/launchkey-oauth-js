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
        // Browser globals for those that don't support AMD
        win.LaunchKey = factory();
    }
}(window, function() {

    // in an anonymous function. This minimizes your footprint on the customer's site,
    // and ensures your functions won't be overwritten later, which would break your code.
    var oauthParams = {},
        queryString = location.hash.substring(1),
        regex = /([^&=]+)=([^&]*)/g,
        oAuthUrl = "https://oauth.launchkey.com/",
        m,
        user = '',
        state,
        accessToken = '';

    /**
    * @private
    * Sets a cookie
    * @param {String} name The name of the cookie to set
    * @param {String} cookieValue The value of the cookie being set
    * @param {[type]} expireTime The time the cookie will expire
    */
    function setCookie(name, cookieValue, expireTime) {
        var today = new Date();
        var expire = new Date();
        expire.setTime(today.getTime() + 3600000 * expireTime);
        document.cookie = name + "=" + cookieValue + ";expires=" + expire.toUTCString() + ";";
        var secure = window.location.protocol === 'https:';
        if (secure === true) {
            document.cookie += "secure;"
        }
    }

    /**
    * @private
    * Reads a given cookie
    * @param  {String} name The name of the cookie to read
    * @return {String} The value of the requested cookie
    */
    function readCookie(name) {
        var cookie = " " + document.cookie;
        var ind = cookie.indexOf(" " + name + "=");
        if (ind === -1) ind = cookie.indexOf(";" + name + "=");
        if (ind === -1 || name == "") return "";
        var ind1 = cookie.indexOf(";", ind + 1);
        if (ind1 === -1) ind1 = cookie.length;
        return cookie.substring(ind + name.length + 2, ind1);
    }

    /**
    * @private
    * Deletes a given cookie
    * @param  {String} name The cookie to delete
    * @return {undefined}
    */
    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    /**
     * @private
     * Framework independent function to load CSS
     * @param path To the CSS file
     * @returns {HTMLElement}
     */
    function loadStyleSheet(path) {
       var head = document.getElementsByTagName( 'head' )[0], // reference to document.head for appending/ removing link nodes
           link = document.createElement( 'link' );           // create the link node
       link.setAttribute( 'id', 'cssLKLoad'); // set an attribute to
       link.setAttribute( 'href', path );
       link.setAttribute( 'rel', 'stylesheet' );
       link.setAttribute( 'type', 'text/css' );

       var sheet, cssRules;
       // get the correct properties to check for depending on the browser
       if ( 'sheet' in link ) {
          sheet = 'sheet'; cssRules = 'cssRules';
       }
       else {
          sheet = 'styleSheet'; cssRules = 'rules';
       }

       head.appendChild( link );  // insert the link node into the DOM and start loading the style sheet

       return link; // return the link node;
    }

    /**
    * @public
    * Logs the user out of their current session
    * @return {undefined}
    */
    function logout() {
        accessToken = readCookie("LKlogin");
        window.open(oAuthUrl + "logout?close=true&access_token=" + accessToken,
                'LaunchKey OAuth logout','height=200,width=150').blur();
        window.focus();
        deleteCookie("LKlogin");
        deleteCookie("LKuser");
        document.location.reload(true);
    }

    /**
    * @public
    *
    * Add the LaunchKey button to your page.
    *
    * @param {Object} options The options available to the customer
    * @param {Number} options.appKey The unique key for your application. No default.
    * @param {String} options.size The size of the icon. Default is "large"
    * @param {String} options.length Text length. Default is "full" for "Log in with LaunchKey". "Log in" is "short" and no text for "mini"
    * @param {String} options.color The color of the button. Default is "blue". "light" and "dark" supported
    * @param {String} options.redirectUrl Where the customer should go once logged in. Default is the current page
    * @param {String} options.el The element you want to turn into a LaunchKey button. Default is an element with the id="lkLoginButton"
    * @return {undefined}
    */
    function init(options) {
    // Sets the defaults
    var color = options.color ? options.color.toLowerCase() : 'blue',
        size = options.size ? options.size.toLowerCase() : 'large',
        length = options.length ? options.length.toLowerCase() : 'full',
        el = options.el || document.getElementById('lkLoginButton');
    var defaultRedirectUrl = encodeURIComponent(location.protocol + '//' + location.host + window.location.pathname);
    var redirectUrl = options.redirectUrl ? encodeURIComponent(options.redirectUrl) : defaultRedirectUrl;

    var authorized = false;

    while (m = regex.exec(queryString)) {
      oauthParams[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }

    state = readCookie("LKstate");

    if (oauthParams.state === state) {
        setCookie("LKlogin", oauthParams.access_token, oauthParams.expires_in);
        setCookie("LKuser", oauthParams.user_id, oauthParams.expires_in);
        //Session exists, user is logged in
        authorized = true;
    }
    else {
        accessToken = readCookie("LKlogin");
        user = readCookie("LKuser");
        if (accessToken !== "" && user !== "") {
            //Session exists, user is logged in
            authorized = true;
        }
    }

    state = Math.max(0.01, Math.random()).toString(36).slice(2);
    setCookie("LKstate", state, 1);

    if (readCookie("LKstate") !== state) {
        state = "";
    }

    if (el) {
        el.innerHTML = "<a id=\"lkButton\" href=\"" + oAuthUrl + "authorize?client_id=" + encodeURIComponent(options.appKey.toString()) + "&redirect_uri=" + redirectUrl + "&response_type=token&scope=&state=" + encodeURIComponent(state) + "\" class=\"lkloginbtn " + length + " " + color + " " + size + "\"><span class=\"icon\"></span></a>";
        var $ = document;
        var cssLoad = 'cssLKLoad';
        if (!$.getElementById(cssLoad)) {
            loadStyleSheet("https://launchkey.com/stylesheets/buttons.css");
        }
        if (length === "short") {
            document.getElementById('lkButton').innerHTML += "<span class=\"text\">Log in</span>";
        }
        else if (length === "full") {
            document.getElementById('lkButton').innerHTML += "<span class=\"text\">Log in with LaunchKey</span>";
        }
    }
  }

  return {
      init: init,
      logout: logout
  };
}));
