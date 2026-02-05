const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.static('public'));

let drawingHistory = [];

// Function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

io.on('connection', (socket) => {
    console.log('New client connected', socket.id);    

    socket.emit('load-drawing', drawingHistory);

    socket.on('draw', (data) => {
        drawingHistory.push(data);
        socket.broadcast.emit('draw', data);
    });

    socket.on('clear-canvas', () => {
        drawingHistory = [];
        io.emit('clear-canvas');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
const localIP = getLocalIP();
server.listen(PORT, () => {
    console.log(`\n🎨 Whiteboard Server Running`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Mobile/Network: http://${localIP}:${PORT}\n`);
});
