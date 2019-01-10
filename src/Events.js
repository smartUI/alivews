export default class Events {
    constructor() {
        this.$el = document.createElement('div');
        this.parseData = false;
    }
    _generateEvent(type, detail) {
        return new CustomEvent(type, {
            bubbles: false,
            cancelable: false,
            detail
        });
    }
    emit(type, data = {}) {
        this.$el.dispatchEvent(this._generateEvent(type, data));
    }
    on(type, cb, ctx = null) {
        this.$el.addEventListener(type, function (evt) {
            cb.call(ctx, evt.detail);
        });
    }
}





// Polyfill: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {
    if (typeof window.CustomEvent === "function") {
        return false;
    }

    function CustomEvent(event, args) {
        args = args || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, args.bubbles, args.cancelable, args.detail);
        return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();