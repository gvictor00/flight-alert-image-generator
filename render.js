const fs = require("fs-extra");
const path = require("path");
const { chromium } = require("playwright");

async function render() {

const template = await fs.readFile(
path.join(__dirname, "templates/ida-volta.html"),
"utf8"
);

const data = await fs.readJson("data.json");

function joinLines(arr) {
return arr.join("<br/>");
}

let html = template
.replace("{{title}}", data.title)

.replace("{{outbound_route}}", data.outbound.route)
.replace("{{outbound_costs}}", joinLines(data.outbound.costs))
.replace("{{outbound_dates}}", joinLines(data.outbound.dates))

.replace("{{return_route}}", data.return.route)
.replace("{{return_costs}}", joinLines(data.return.costs))
.replace("{{return_dates}}", joinLines(data.return.dates))

.replace("{{destination}}", data.destination)
.replace("{{footer}}", data.footer);


const browser = await chromium.launch();
const page = await browser.newPage();

await page.setViewportSize({
width: 1080,
height: 1080
});

await page.setContent(html);

await page.screenshot({
path: "output/alert.png"
});

await browser.close();

}

render();