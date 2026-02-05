const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let drawing = false;
let currentColor = 'black';
let brushSize = 5;
let isErasing = false;
let lastX = 0;
let lastY = 0;

const socket = io();

socket.on('connect', () => {
    statusDiv.textContent = 'Connected';
    statusDiv.classList.add('connected');
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Disconnected';
    statusDiv.classList.remove('connected');
});

socket.on('load-drawing', (history) => {
    history.forEach(data => drawOnCanvas(data));
});

socket.on('draw', (data) => {
    drawOnCanvas(data);
});

socket.on('clear-canvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function drawOnCanvas(data) {
    const { x0, y0, x1, y1, color, size, isErase } = data;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = isErase ? 'white' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function startDrawing(e) {
    drawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function draw(e) {
    if (!drawing) return;
    
    e.preventDefault();
    const [x, y] = getCoordinates(e);

    const data = {
        x0: lastX,
        y0: lastY,
        x1: x,
        y1: y,
        color: isErasing ? 'white' : currentColor,
        size: isErasing ? 20 : brushSize,
        isErase: isErasing
    };

    drawOnCanvas(data);
    socket.emit('draw', data);

    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    drawing = false;
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.type.includes('touch')) {
        return [
            e.touches[0].clientX - rect.left,
            e.touches[0].clientY - rect.top
        ];
    } else {
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }
}

function changeColor(color) {
    currentColor = color;
    isErasing = false;
}

function changeBrushSize(size) {
    brushSize = size;
    isErasing = false;
}

function toggleEraser() {
    isErasing = !isErasing;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-canvas');
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);
