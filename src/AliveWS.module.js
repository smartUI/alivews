(function (global, factory) {
    if (typeof define == 'function' && define.amd) {
        define([], factory);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        global.AliveWS = factory();
    }
})(this, function () {

    if (!('WebSocket' in window)) {
        return;
    }

    function AliveWS(url, protocols, options) {
        this.url = url;
    }
    return AliveWS;
});