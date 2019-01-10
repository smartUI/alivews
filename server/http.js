const http = require('http');
const express = require('express');
const compression = require('compression');
const chalk = require('chalk');

const app = express();
app.use(compression());

const httpServer = http.createServer(app);
const port = 9090;
httpServer.listen(port, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log();
    console.log(`HTTP Server is running on: `, chalk.green.bold(`http://127.0.0.1:${port}`));
});

app.get('/build/test.js', function getState(req, res, next) {
    res.setHeader('Content-Type', 'text/javascript');
    res.sendfile(`./build/test.js`)
})

app.get('/', function getState(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.sendfile(`./test/index.html`)
})