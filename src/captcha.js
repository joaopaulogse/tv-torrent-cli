const tesseract = require("tesseract.js")
const fs = require("fs");
const _ = require("lodash");
module.exports = async (page) => {
    try {
        await page.waitFor("#solve_string");
        await page.waitFor("img[lazyload='off']");
    } catch (error) {
        console.error(error);
    }
    const capt = await page.$("img[lazyload='off']");
    if (!_.isEmpty(capt)) {
      await page.waitFor(1000);
      async function screenshotDOMElement(selector, padding = 0) {
        const rect = await page.evaluate(selector => {
          const element = document.querySelector(selector);
          const { x, y, width, height } = element.getBoundingClientRect();
          return { left: x, top: y, width, height, id: element.id };
        }, selector);

        return await page.screenshot({
          path: "element.png",
          clip: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
          }
        });
      }
      await screenshotDOMElement("img[lazyload='off']");
      const { text } = await tesseract.recognize(`${__dirname}/../element.png`);
      await page.type("#solve_string", text);
      await fs.unlinkSync(`${__dirname}/../element.png`)
      return page;
    } else {
      return page;
    }
}