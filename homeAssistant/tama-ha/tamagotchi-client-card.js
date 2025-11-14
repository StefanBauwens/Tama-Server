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
                <ha-card>
                    <style>
                        #bgImage { 
                            position:absolute; 
                            z-index: -1;
                            width: 625px;
                        }
                        
                        #canvas {
                            position:absolute;
                            top: 342px;
                            left: 168px;
                        }

                        .tamaBtn {
                            border: none;
                            appearance: none;
                            background-color: inherit;
                        }

                        .tamaBtn img {
                            width: 67px;
                            content: url("/local/tama-ha/img/button-release.png");
                        }

                        .tamaBtn:active img {
                            width: 67px;
                            content: url("/local/tama-ha/img/button-press.png");
                        }

                        #leftBtn {
                            position: absolute;
                            top: 667px;
                            left: 173px;
                        }

                        #midBtn {
                            position: absolute;
                            top: 688px;
                            left: 293px;
                        }

                        #rightBtn {
                            position: absolute;
                            top: 667px;
                            left: 413px;
                        }

                        #topIcons {
                            position: absolute;
                            top: 268px;
                            left: 173px;
                        }

                        #bottomIcons {
                            position: absolute;
                            top: 518px;
                            left: 177px
                        }

                        #topIcons img, #bottomIcons img {
                            width: 75px;
                            filter: invert(86%) sepia(0%) saturate(363%) hue-rotate(134deg) brightness(83%) contrast(81%);
                            opacity: 0.18;
                        }
                        
                        #topIcons img.selected, #bottomIcons img.selected {
                            width: 75px;
                            filter: none;
                            opacity: 1;
                        }

                        #tamagotchi {
                            position: relative;
                            left: 0px;
                            transform-origin: left top;
                            width: 625px;
                            height: 450px;
                            padding: 16px;
                        }
                        
                        .card-content {
                            position: relative;
                            //width: 100%;
                            margin: 0px;
                            padding: 0px;
                            aspect-ratio: 0.82;
                            overflow: hidden;
                        }
                    </style>

                    <div class="card-content">
                        <div id="tamagotchi">
                            <img id="bgImage" src="/local/tama-ha/img/bg.png">

                            <div id="topIcons">
                                <img id="icon1" src="/local/tama-ha/img/icon1.png">
                                <img id="icon2" src="/local/tama-ha/img/icon2.png">
                                <img id="icon3" src="/local/tama-ha/img/icon3.png">
                                <img id="icon4" src="/local/tama-ha/img/icon4.png">
                            </div>
                            <div id="bottomIcons">
                                <img id="icon5" src="/local/tama-ha/img/icon5.png">
                                <img id="icon6" src="/local/tama-ha/img/icon6.png">
                                <img id="icon7" src="/local/tama-ha/img/icon7.png">
                                <img id="icon8" src="/local/tama-ha/img/icon8.png">
                            </div>

                            <canvas id="canvas" width="320" height="160"></canvas>

                            <button type="button" class="tamaBtn" id="leftBtn"><img src="/local/tama-ha/img/button-release.png"></button>
                            <button type="button" class="tamaBtn" id="midBtn"><img src="/local/tama-ha/img/button-release.png"></button>
                            <button type="button" class="tamaBtn" id="rightBtn"><img src="/local/tama-ha/img/button-release.png"></button>
                        </div>
                    </div>
                </ha-card>
            `;
            
            this.tamagotchi         = this.querySelector("#tamagotchi");
            this.content            = this.querySelector(".card-content");
            this.canvas             = this.querySelector("canvas");
            this.ctx                = this.canvas.getContext("2d");

            let leftBtn             = this.querySelector("#leftBtn");
            let midBtn              = this.querySelector("#midBtn");
            let rightBtn            = this.querySelector("#rightBtn");

            const icon1             = this.querySelector("#icon1");
            const icon2             = this.querySelector("#icon2");
            const icon3             = this.querySelector("#icon3");
            const icon4             = this.querySelector("#icon4");
            const icon5             = this.querySelector("#icon5");
            const icon6             = this.querySelector("#icon6");
            const icon7             = this.querySelector("#icon7");
            const icon8             = this.querySelector("#icon8");

            this.icons              = [icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8];

            leftBtn.onmousedown     = () => {this.send("a-press");};
            midBtn.onmousedown      = () => {this.send("b-press");};
            rightBtn.onmousedown    = () => {this.send("c-press");};
                                                
            leftBtn.onmouseup       = () => {this.delayedSend("a-release");};
            midBtn.onmouseup        = () => {this.delayedSend("b-release");};
            rightBtn.onmouseup      = () => {this.delayedSend("c-release");};

            this.gateway = this.config.gateway;
            this.initWebSocket();

            // handle auto resizing
            setTimeout(() => this.updateScale(), 50);
            window.addEventListener("resize", () => this.updateScale());
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
        setTimeout(() => {
            if (this.isConnected) {
                this.initWebSocket();
            } else {
                console.log("Card no longer connected! Skipping reconnect");
            }
        }, 2000);
    }

    async onMessage(event) {
        if (!this.isConnected) {
            this.websocket.close();
        }

        const buffer = await event.data.arrayBuffer();
        const messageBuffer = new Uint8Array(buffer);

        if (messageBuffer.length == 8) { // receive icon
            for(let i = 0; i < messageBuffer.length; i++) {
                if(messageBuffer[i] == 1) {
                    this.icons[i].classList.add("selected");
                } else {
                    this.icons[i].classList.remove("selected");
                }
            }
        } else { // receive screen
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for(let y = 0; y < LCD_HEIGHT; y++)
            {
                for(let x = 0; x < LCD_WIDTH; x++)
                {
                    let charIndex = Math.floor(((y * LCD_WIDTH) + x) / 7);
                    let rest = ((y * LCD_WIDTH) + x) % 7;
                    let character = messageBuffer[charIndex];
                    let val = this.bitRead(character, 6 - rest);
                    this.ctx.fillStyle = val? '#000000' : '#aaaaaa2f';
                    this.ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
                }
            }
        }
        this.send("ack"); // improves the connection
    }

    send(message) {
        this.websocket.send(message);
    }

    delayedSend(message) { // helps with buttons
        setTimeout(() => {
            this.send(message);
        }, 100);
    }

    bitRead(value, n) {
        return (value >> n) & 1;
    }

    updateScale() {
        const container = this.content;
        const tama = this.tamagotchi;

        if (!container || !tama) return;

        const designWidth = 625;
        const designScale = 0.95;

        const availableWidth = container.clientWidth;
        const scale = availableWidth / designWidth * designScale;
        
        tama.style.transform = `scale(${scale})`;
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
            return 10;
    }

    // The rules for sizing your card in the grid in sections view
    getGridOptions() {
        return {
            rows: 3,
            columns: 1,
            min_rows: 3,
            max_rows: 10,
        };
    }
}

customElements.define("tamagotchi-client-card", TamagotchiClientCard);
