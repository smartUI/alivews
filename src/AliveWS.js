import Events from './Events';
Events.parseData = !0; // 返回的数据是json字符串，需要JSON.parse反序列化一下


const WS_CLOSE_AUTOMATIC = 1; // 自动关闭（网络原因、后台服务之类的，非手动调用）
const WS_CLOSE_FORCED = 2; // 人为强制关闭（人为调用）

const WS_CONNECT_TYPE_CONNECT = 1; // 直连
const WS_CONNECT_TYPE_RECONNECT = 2; // 重连

const WS_ALLOW_LOST_HEARTBEAT = 2; // 累计丢失心跳达到设定的值后重连


const WS_OPTIONS = {
    pingTimeout: 3000, // 心跳的间隔时间
    onPing: null, // ping回调方法
    onPong: null, // pong回调方法
    dataType: 'json', // 发送数据的格式
    auto: true, // 是否在实例化时创建WebSocket
    minReconnectDelay: 1000, // 尝试重新连接之前要延迟的毫秒数，类似于 y = a * b^x 曲线变化中的参数a
    maxReconnectDelay: 30000, // 延迟重新连接尝试的最大毫秒数
    reconnectDecay: 1.5, // 重新连接延迟增加的速率，类似于 y = a * b^x 曲线变化中的参数b
    connectionTimeout: 2000, // 连接ws超时，并且关闭重试；连接之前等待连接成功的最大毫秒数
    maxRetries: 8, // 尝试重新连接的最大次数，Infinity表示不受限制
    binaryType: 'blob', // 可能的取值：blob、arraybuffer, default：blob
}

export default class AliveWS {
    constructor(url, protocols = [], options = {}) {

        if ('string' != (typeof url)) {
            throw TypeError('AliveWS url type is error');
        }

        this.ws = null;
        this.pingTimer = null;
        this.losePong = 0; // 丢失心跳的次数

        this.options = Object.assign({}, WS_OPTIONS, options || {});
        this.closeType = WS_CLOSE_AUTOMATIC;
        this.connectType = WS_CONNECT_TYPE_CONNECT;
        this.protocols = protocols;
        this.url = url; // 只读
        Object.defineProperty(this, 'url', {
            writable: false
        });

        this.beatcount = 0;
        this.retries = 0; // 自连接后，尝试重新连接的总次数，连接成功后会归为0

        // 连接状态： WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED
        this.readyState = WebSocket.CONNECTING;

        this.Events = new Events();

        if (this.options.auto === true) {
            this.connect();
        }
    }

    get protocol() {
        return (this.ws || {}).protocol;
    }

    on(type, cb, ctx = null) {
        this.Events.on(type, cb, ctx);
    }

    ping() {
        clearTimeout(this.pingTimer);
        this.pingTimer = setTimeout(() => {
            console.log('losePong:', this.losePong);
            this.losePong++;
            this.beatcount++;
            if (this.losePong > WS_ALLOW_LOST_HEARTBEAT) {
                this.refresh(); // 刷新关闭ws后重连
            } else {
                this.ping();
                this.options.onPing && this.options.onPing();
            }
        }, this.options.pingTimeout);
    }

    pong() {
        this.losePong = 0;
        this.options.onPong && this.options.onPong();
    }

    stopPing() {
        clearTimeout(this.pingTimer);
        this.pingTimer = undefined;
    }

    connect() {
        this.beatcount = 0;
        const {
            Events,
            url,
            protocols,
            connectType,
            options
        } = this;

        const {
            connectionTimeout,
            maxRetries,
            binaryType,
            minReconnectDelay,
            maxReconnectDelay,
            reconnectDecay,
        } = options;

        if (connectType === WS_CONNECT_TYPE_RECONNECT && maxRetries && this.retries > maxRetries) {
            return;
        }

        const ws = new WebSocket(url, protocols);
        ws.binaryType = binaryType;

        if (connectType === WS_CONNECT_TYPE_CONNECT) {
            Events.emit('connecting');
            this.retries = 0;
        }

        if (AliveWS.config.debug) {
            console.debug('AliveWS', 'attempt-connect', this.url);
        }

        let timedOut = false; // 超时
        // 连接超时
        const timeout = setTimeout(() => {
            if (AliveWS.config.debug) {
                console.debug('AliveWS', 'connection-timeout', this.url);
            }
            timedOut = true;
            ws.close();
            timedOut = false;
        }, connectionTimeout);

        ws.onopen = (event) => {
            clearTimeout(timeout);
            if (AliveWS.config.debug) {
                console.debug('AliveWS', 'onopen', this.url);
            }
            // this.protocol = ws.protocol;
            this.readyState = WebSocket.OPEN;
            this.retries = 0;
            this.losePong = 0;
            Events.emit('open', {
                reconnect: this.connectType
            });
            this.connectType = WS_CONNECT_TYPE_CONNECT;
        };

        ws.onclose = (event) => {
            clearTimeout(timeout);

            this.ws = null;

            if (this.closeType === WS_CLOSE_FORCED) {
                this.readyState = WebSocket.CLOSED;
                Events.emit('close');
            } else {
                this.readyState = WebSocket.CONNECTING;
                Events.emit('connecting', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });
                if (this.connectType === WS_CONNECT_TYPE_CONNECT && !timedOut) {
                    if (AliveWS.config.debug) {
                        console.debug('AliveWS', 'onclose', this.url);
                    }
                    Events.emit('close');
                }

                // 类似于 y = a * b^x 曲线变化
                var timeout = minReconnectDelay * Math.pow(reconnectDecay, this.retries);

                const delay = timeout > maxReconnectDelay ? maxReconnectDelay : timeout;
                setTimeout(() => {
                    if (AliveWS.config.debug) {
                        console.debug('AliveWS', 'reconnect', 'retries:' + this.retries, 'delay:' + delay);
                    }
                    this.retries++;
                    this.connectType = WS_CONNECT_TYPE_RECONNECT;
                    this.connect();
                }, delay);
            }
        };

        ws.onmessage = (event) => {
            if (AliveWS.config.debug) {
                console.debug('AliveWS', 'onmessage', this.url, event.data);
            }
            Events.emit('message', JSON.parse(event.data));
        };
        ws.onerror = (event) => {
            if (AliveWS.config.debug) {
                console.debug('AliveWS', 'onerror', this.url, event);
            }
            Events.emit('error');
        };

        this.ws = ws;

        if (AliveWS.config.debug) {
            window.__ALIVEWS_DEBUG__ = this;
        }
    }

    close(code = 1000, reason = '') {
        const {
            ws,
        } = this;
        this.closeType = WS_CLOSE_FORCED;
        if (ws) {
            ws.close(code, reason);
        }
    }

    send(data) {
        if (this.ws) {
            if (AliveWS.config.debug) {
                console.debug('AliveWS', 'send', this.url, data);
            }
            if (String(this.options.dataType).toLowerCase() === 'json') {
                return this.ws.send(JSON.stringify(data));
            } else {
                return this.ws.send(data);
            }
        } else {
            throw 'INVALID_STATE_ERROR: Pausing to reconnect WebSocket';
        }
    }

    // 刷新连接，关闭后会自动重连
    refresh() {
        if (this.ws) {
            this.ws.close();
        }
    }

}

AliveWS.config = {};
AliveWS.CONNECTING = WebSocket.CONNECTING;
AliveWS.OPEN = WebSocket.OPEN;
AliveWS.CLOSING = WebSocket.CLOSING;
AliveWS.CLOSED = WebSocket.CLOSED;