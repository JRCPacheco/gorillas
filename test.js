const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const js = fs.readFileSync(__dirname + "/jogo.js", "utf8");

const dom = new JSDOM(html, { 
    runScripts: "dangerously",
    resources: "usable"
});

// Emulate required browser APIs
dom.window.Math.random = () => 0.5;
dom.window.requestAnimationFrame = () => {};
dom.window.innerWidth = 1280;
dom.window.innerHeight = 800;
dom.window.alert = () => {};
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    getImageData: () => ({ data: new Uint8Array(4) })
});

try {
    // Replace eval(js) with safer script injection
    const scriptEl = dom.window.document.createElement("script");
    scriptEl.textContent = js;
    dom.window.document.body.appendChild(scriptEl);
    // Trigger load event
    const event = dom.window.document.createEvent('Event');
    event.initEvent('load', false, false);
    dom.window.dispatchEvent(event);
    
    // Simulate click
    dom.window.document.getElementById('iniciar').click();
    console.log("Success! tela-jogo escondida:", dom.window.document.getElementById('tela-jogo').classList.contains('escondido'));
} catch (e) {
    console.error("ERROR!");
    console.error(e);
}
