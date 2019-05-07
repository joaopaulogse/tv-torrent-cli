const cheerio = require("cheerio");

module.exports = async page => {
  await page.waitFor(".legendeitm-grid-post-details");
  const html = await page.content();
  const $ = cheerio.load(html);
  let legendsArray = [];
  $(".legendeitm-grid-post-details").each((i, element) => {
    const link = $(element).find("a");
    legendsArray.push({
      link: link.attr("href"),
      text: link.text()
    });
  });
  const legendOptions = legendsArray.map(({ text, link }) => ({
    name: text,
    value: link
  }));
  return legendOptions;
};
