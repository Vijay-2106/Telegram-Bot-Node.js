const port = process.env.port;
//packages
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const https = require("https");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const app = express();

//other files require
const config = require("./config/config");
const database = require("./migration/mongo.database");
const responseApi = require("./services/responseApi");
const commonService = require("./services/common.service")
// telegram bot
const telegramBot = require('./services/bot.service')

// const ee = require('./bot/bot.index')

//router file require
const adminRouter = require("./routes/admin.router");
const uploadRouter = require("./routes/upload.router");
const usersRouter = require("./routes/user.router");

const limiter = rateLimit({
    windowMs: 1000,
    max: 50,
    message: { status: false, message: "Too many request from this IP" }
});

//requirements
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(limiter);
app.use(helmet());
//base api
app.get('/', (req, res) => {
    res.json(responseApi.success_response('backend successfully worked', {}, res.statusCode));
})

app.get("/ASedsxaDre", (req, res) => {
    res.json(responseApi.success_response('got time', { date: Date.now() }, res.statusCode));
})

//use router
app.use('/api/v1/admin', commonService.grrtverfy, adminRouter)
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/users', commonService.grrtverfy, usersRouter)

//cron
const cron = require("./services/cron.service");
//cors origin
const allowCrossDomain = function (req, res, next) {
    if ("OPTIONS" == req.method) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.send(200);
    } else {
        next();
    }
}

app.use(allowCrossDomain);

app.all("/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

//Add headers
app.use(function (req, res, next) {
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Origin", "*");
    } else {
        res.header("Access-Control-Allow-Origin", "*")
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
})



//router error
app.all('*', (req, res, next) => {
    res.json(responseApi.error_response(`Can't find ${req.originalUrl} on this Server`, {}, res.statusCode));
});

//server start
// const options = {
//     key: fs.readFileSync('./sslkeys/cHJvamVjdA.key'),
//     cert: fs.readFileSync('./sslkeys/cHJvamVjdA.crt')
// };

const server = process.env.node_env == 'development' ? http.createServer(app) : https.createServer(options, app);

//server connecting
server.listen(port, () => console.log(`Express server running on port ${port}`));

var io = require("./configration/socket").listen(server, { pingTimeout: 30000 })

process.on("SIGINT", () => {
    console.log("SIGINT signal received");
    //stops the server from accepting new connections and finished existing connections
    server.close(function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        mongoose.connection.close()
            .then(() => {
                console.log("mongoose connection disconnected");
                process.exit(0);
            })
    })
})

//export file
module.exports = app;
