module.exports.listen = (app) => {
    io = require('socket.io')(app, {
        cors: {
            origin: '*',
        }
    })

    io.on('connection', socket => {

    });
    return io;
}