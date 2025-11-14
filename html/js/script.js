const websocketOpenedEvent  = new CustomEvent('websocketOpenedEvent');
const gateway               = `wss://tama.yourdomain.org/ws`; // use wss if you want it to work on https, you may need to use a reverse proxy like caddy to make that work
//const gateway		    = `ws://192.168.0.72/ws`; // or use ws on LAN
var websocket;

const pixelSize         = 10;
const canvas            = document.getElementById("canvas");
const ctx               = canvas.getContext("2d");

const leftBtn           = document.getElementById("leftBtn");
const midBtn            = document.getElementById("midBtn");
const rightBtn          = document.getElementById("rightBtn");

const icon1             = document.getElementById("icon1");
const icon2             = document.getElementById("icon2");
const icon3             = document.getElementById("icon3");
const icon4             = document.getElementById("icon4");
const icon5             = document.getElementById("icon5");
const icon6             = document.getElementById("icon6");
const icon7             = document.getElementById("icon7");
const icon8             = document.getElementById("icon8");

const icons             = [icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8];

const LCD_WIDTH         = 32;
const LCD_HEIGHT        = 16;

// Init web socket when the page loads
window.addEventListener('load', onload);

function onload(event) {
    initWebSocket();

    leftBtn.onmousedown     = () => {send("a-press");};
    midBtn.onmousedown      = () => {send("b-press");};
    rightBtn.onmousedown    = () => {send("c-press");};
                                        
    leftBtn.onmouseup       = () => {delayedSend("a-release");};
    midBtn.onmouseup        = () => {delayedSend("b-release");};
    rightBtn.onmouseup      = () => {delayedSend("c-release");};
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
    const messageBuffer = new Uint8Array(buffer);

    if (messageBuffer.length == 8) { // receive icon
        for(let i = 0; i < messageBuffer.length; i++) {
            if(messageBuffer[i] == 1) {
                icons[i].classList.add("selected");
            } else {
                icons[i].classList.remove("selected");
            }
        }
    } else { // receive screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let y = 0; y < LCD_HEIGHT; y++)
        {
            for(let x = 0; x < LCD_WIDTH; x++)
            {
                let charIndex = Math.floor(((y * LCD_WIDTH) + x) / 7);
                let rest = ((y * LCD_WIDTH) + x) % 7;
                let character = messageBuffer[charIndex];
                let val = bitRead(character, 6 - rest);
                ctx.fillStyle = val? '#000000' : '#aaaaaa2f';
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1 , pixelSize - 1);
            }
        }
    }
    send("ack"); // improves the connection
}

function send(message) {
    websocket.send(message);
}

function delayedSend(message) { // helps with buttons
    setTimeout(() => {
        send(message);
    }, 100);
}

function bitRead(value, n) {
    return (value >> n) & 1;
}