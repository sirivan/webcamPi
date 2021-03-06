module.exports = function(server) {
    var io = require('socket.io')(server),
        fs = require('fs'),
        path = require('path');

    var watching = false,
        spawn = require('child_process').spawn,
        proc,
        sockets = {};

    var clientfilename = 'stream/image.jpg',
        filename = path.join(__dirname, "/public/stream/image.jpg");


    io.on('connection', function(socket) {
        sockets[socket.id] = socket;

        socket.on('disconnect', function() {
            delete sockets[socket.id];
            stopStreaming();
        });
        socket.on('start-stream', function() {
            startStreaming(io);
        });
    });

    function stopStreaming() {
        if (Object.keys(sockets).length === 0) {
            watching = false;
            if (proc) {
                proc.kill();
            }
            fs.unwatchFile(filename);
        }
    }

    function startStreaming(io) {
        if (watching) {
            io.sockets.emit('live-stream', clientfilename + '?_t=' + (Math.random() * 100000));
            return;
        }

        var args = ["-r", "640x480", "-l", "1", "-q", "--no-banner", filename];
        proc = spawn('fswebcam', args);

        watching = true;

        fs.watchFile(filename, {
            interval: 100
        }, function() {
            io.sockets.emit('live-stream', clientfilename + '?_t=' + (Math.random() * 100000));
        })
    }
}