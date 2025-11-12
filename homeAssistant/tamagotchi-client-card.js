const LCD_WIDTH     = 32;
const LCD_HEIGHT    = 16;
const PIXEL_SIZE    = 10;

class TamagotchiClientCard extends HTMLElement {
    // Whenever the state changes, a new `hass` object is set. Use this to
    // update your content.
    set hass(hass) {
        // Initialize the content if it's not there yet.
        if (!this.content) {
            this.innerHTML = `
                <ha-card header="Example-card">
                <div class="card-content">
                    <canvas id="canvas" width="320" height="160"></canvas>
                    <br>
                    <button type="button" id="leftBtn">A</button>
                    <button type="button" id="midBtn">B</button>
                    <button type="button" id="rightBtn">C</button>
                </div>
                </ha-card>
            `;
            this.content = this.querySelector("div");
            this.canvas = this.querySelector("canvas");
            this.ctx = this.canvas.getContext("2d");

            let leftBtn     = this.querySelector("#leftBtn");
            let midBtn      = this.querySelector("#midBtn");
            let rightBtn    = this.querySelector("#rightBtn");
            leftBtn.onmousedown     = () => {this.Send("a-press");};
            midBtn.onmousedown      = () => {this.Send("b-press");};
            rightBtn.onmousedown    = () => {this.Send("c-press");};
            leftBtn.onmouseup       = () => {this.Send("a-release");};
            midBtn.onmouseup        = () => {this.Send("b-release");};
            rightBtn.onmouseup      = () => {this.Send("c-release");};

            this.gateway = this.config.gateway;//TODO probably need to fetch frame at least once
            this.initWebSocket();
        }
    }

    initWebSocket(gateway) {
        console.log('Trying to open a WebSocket connection…');
        this.websocket = new WebSocket(this.gateway);
        this.websocket.onopen = this.onOpen.bind(this);
        this.websocket.onclose = this.onClose.bind(this);
        this.websocket.onmessage = this.onMessage.bind(this);
    }

    onOpen(event) {
        console.log('Connection opened');
    }

    onClose(event) {
        console.log('Connection closed');
        setTimeout(() => this.initWebSocket(), 2000);
    }

    // Function that receives the message from the ESP
    async onMessage(event) {
        const buffer = await event.data.arrayBuffer();
        const matrixBuffer = new Uint8Array(buffer);

        for(let y = 0; y < LCD_HEIGHT; y++)
        {
            for(let x = 0; x < LCD_WIDTH; x++)
            {
                let charIndex = Math.floor(((y * LCD_WIDTH) + x) / 7);
                let rest = ((y * LCD_WIDTH) + x) % 7;
                let character = matrixBuffer[charIndex];
                let val = this.bitRead(character, 6 - rest);
                this.ctx.fillStyle = val? '#000000' : '#AAAAAA';
                this.ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE - 1 , PIXEL_SIZE - 1);
            }
        }
        this.Send("ack"); // improves the connection
    }

    Send(message) {
        this.websocket.send(message);
    }

    bitRead(value, n) {
        return (value >> n) & 1;
    }

    /* HA stuff */

    // The user supplied configuration. Throw an exception and Home Assistant
    // will render an error card.
    setConfig(config) {
        if (!config.gateway) {
            throw new Error("You need to define a gateway");
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns in masonry view
    getCardSize() {
            return 3;
    }

    // The rules for sizing your card in the grid in sections view
    getGridOptions() {
        return {
            rows: 3,
            columns: 6,
            min_rows: 3,
            max_rows: 3,
        };
    }
}

customElements.define("tamagotchi-client-card", TamagotchiClientCard);