const cheerio = require("cheerio");
const fs = require("fs");
const request = require("request-promise")
module.exports = (page, fileName, search) => {
    return new Promise(async (resolve, reject) => {

    
        const html = await page.content();
        const $ = cheerio.load(html);
        const link = $(".buttondown").attr("href");
        const destination = fs.createWriteStream(`${__dirname}/../files/${search}/${fileName}.zip`);
        request
            .get(link)
            .on("response", res => {
                res.pipe(destination);
            })
            .on("complete", () => {
                resolve(page);
            })
            .on("error", (error)=>{
                reject(error)
            });

    })
};
