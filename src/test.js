import AliveWS from './AliveWS';
AliveWS.debugAll = true;


const alivews = new AliveWS('ws://127.0.0.1:9091');
// alivews.connect();

alivews.options.onPing = () => {
    console.log('---- ping ----')
    alivews.send({
        type: 'ping',
        beatcount: alivews.beatcount,
    });
}

alivews.options.onPong = () => {
    console.log('---- pong ----')
}

alivews.on('connecting', (data) => {
    console.warn('%cconnecting:', 'color:green', data);
});

alivews.on('open', (data) => {
    console.warn('open:', data);
    alivews.ping();
});

alivews.on('message', (data) => {
    console.warn('message:', data);
    if (data.type === 'pong') {
        alivews.pong();
    }
});

alivews.on('error', (data) => {
    console.warn('error:', data);
});

alivews.on('close', (data) => {
    console.warn('close:', data);
});

setTimeout(() => {
    alivews.send({
        type: 'msg',
        data: 'Guess it?'
    });
}, 1000);