const cheerio = require("cheerio");

module.exports = async (page) => {
    await page.waitFor(".lista2t");

    const html = await page.content();
    const $ = cheerio.load(html);
    const files = [];
    $(".lista2").each((i, element) => {
      const file = $(element).find("a[title]");
      files.push({
        file: file.text(),
        link: file.attr("href")
      });
    });
    const options = files.map(({ file, link }) => ({
      name: file,
      value: link
    }));
    return options;
}