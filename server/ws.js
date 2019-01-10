const chalk = require('chalk');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const port = 9091;
const wss = new WebSocketServer({
    port
});

wss.on('connection', function (ws) {

    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        message = JSON.parse(message);
        if (message.type === 'ping') {

            // 模拟收不到pong的情况
            if (message.beatcount <= 5) {
                ws.send(JSON.stringify({
                    type: 'pong',
                    // data: {
                    //     beatcount: message.beatcount
                    // }
                }));
            } else {
                // ws.send(JSON.stringify({
                //     type: 'msg',
                //     data: `no answer pong.`
                // }), (err) => {
                //     if (err) {
                //         console.log(`[SERVER] error: ${err}`);
                //     }
                // });
            }

        } else {
            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: 'msg',
                    data: `My name is AliveWS.`
                }), (err) => {
                    if (err) {
                        console.log(`[SERVER] error: ${err}`);
                    }
                });
            }, 1000);
        }
    });


    ws.send(JSON.stringify({
        type: 'msg',
        data: `What's your name?`
    }), (err) => {
        if (err) {
            console.log(`[SERVER] error: ${err}`);
        }
    });

    ws.on('disconnect', function (data) {
        console.log('disconnect', data);
    });
    ws.on('close', function (data) {
        console.log('close', data);
    });
    ws.on('error', function (data) {
        console.log('error', data);
    });
});

console.log(`ws server started at `, chalk.green.bold(`http://127.0.0.1:${port}`));