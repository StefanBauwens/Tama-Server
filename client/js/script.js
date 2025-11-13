const websocketOpenedEvent  = new CustomEvent('websocketOpenedEvent');
const gateway               = `wss://tama.yourdomain.org/ws`; // use wss if you want it to work on https, you may need to use a reverse proxy like caddy to make that work
var websocket;

const pixelSize         = 10;
const canvas            = document.getElementById("canvas");
const ctx               = canvas.getContext("2d");

const leftBtn           = document.getElementById("leftBtn");
const midBtn            = document.getElementById("midBtn");
const rightBtn          = document.getElementById("rightBtn");
const LCD_WIDTH         = 32;
const LCD_HEIGHT        = 16;

// Init web socket when the page loads
window.addEventListener('load', onload);

function onload(event) {
    initWebSocket();

    leftBtn.onmousedown     = () => {Send("a-press");};
    midBtn.onmousedown      = () => {Send("b-press");};
    rightBtn.onmousedown    = () => {Send("c-press");};
                                        
    leftBtn.onmouseup       = () => {Send("a-release");};
    midBtn.onmouseup        = () => {Send("b-release");};
    rightBtn.onmouseup      = () => {Send("c-release");};
}

function initWebSocket() {
    console.log('Trying to open a WebSocket connection…');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
}

function onOpen(event) {
    console.log('Connection opened');
    document.dispatchEvent(websocketOpenedEvent);
}

function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
}

// Function that receives the message from the ESP
async function onMessage(event) {
    const buffer = await event.data.arrayBuffer();
    const matrixBuffer = new Uint8Array(buffer);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let y = 0; y < LCD_HEIGHT; y++)
    {
        for(let x = 0; x < LCD_WIDTH; x++)
        {
            let charIndex = Math.floor(((y * LCD_WIDTH) + x) / 7);
            let rest = ((y * LCD_WIDTH) + x) % 7;
            let character = matrixBuffer[charIndex];
            let val = bitRead(character, 6 - rest);
            ctx.fillStyle = val? '#000000' : '#aaaaaa2f';
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1 , pixelSize - 1);
        }
    }
    Send("ack"); // improves the connection
}

function Send(message) {
    websocket.send(message);
}

function bitRead(value, n) {
    return (value >> n) & 1;
}