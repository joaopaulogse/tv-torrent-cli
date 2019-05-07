#!/usr/bin/env node

const [, , ...args] = process.argv;

const fonts = require("cfonts");
const inquirer = require("inquirer");
inquirer.registerPrompt("suggest", require("inquirer-prompt-suggest"));

const fs = require("fs");
const unzip = require("unzip");
const path = require("path");

const puppeteer = require("puppeteer");
const ora = require("ora");
const _ = require("lodash");

const captcha = require("../src/captcha");
const search = require("../src/search");
const getOptions = require("../src/getOptions");
const download = require("../src/download");
const getLegends = require("../src/getLegends");
const downloadLegend = require("../src/downloadLegend");

(async () => {
  fonts.say("Tv cli", {
    font: "block",
    align: "left", // define text alignment
    background: "transparent",
    colors: ["green", "yellow", "white"],
    space: true
  });
  const suggestion = [
    "the flash",
    "game of thrones",
    "chicago fire",
    "chicago pd",
    "suits"
  ];

  const response = await inquirer.prompt([
    {
      name: "search",
      message: "O que você procura?",
      type: "suggest",
      suggestions: [...suggestion]
    }
  ]);
  try {
    const dir = `${__dirname}/../files/${response.search}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const spinner = ora("Loading Browser").start();
    const browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();

    await page.goto(
      `https://rarbgproxied.org/torrents.php?search=${response.search}`
    );
    spinner.text = "Loading Page";
    // captcha
    spinner.text = "Vefirication human";
    page = await captcha(page);

    // search
    spinner.text = `Searching for '${response.search}'`;
    page = await search(page, response.search);

    spinner.stop();
    let options = await getOptions(page);
    spinner.text = "Select torrent";
    const option = await inquirer.prompt([
      {
        message: "Qual desses ?",
        name: "link",
        choices: options,
        type: "list"
      }
    ]);
    spinner.start();
    await page.evaluate(url => {
      window.location.href = url;
    }, option.link);

    await page.waitFor("a[onmouseover]");
    const magnetLink = await page.evaluate(() => {
      return document
        .querySelector("a[onmouseover]")
        .parentElement.querySelectorAll("a")[1].href;
    });
    spinner.stop();
    const { confirm: legends } = await inquirer.prompt([
      {
        message: "Deseja procurar legenda?",
        name: "confirm",
        type: "confirm",
        default: true
      }
    ]);

    if (legends) {
      await page.evaluate(url => {
        window.location.href = url;
      }, `https://legendei.com/?s=${response.search}`);

      const optionLegends = await getLegends(page);

      const { link: linkLegends } = await inquirer.prompt([
        {
          message: "Qual dessas legendas você quer ?",
          name: "link",
          choices: optionLegends,
          type: "list"
        }
      ]);
      await page.evaluate(url => {
        window.location.href = url;
      }, linkLegends);

      await page.waitFor("strong");

      try {
        await page.waitFor(".buttondown");
      } catch (error) {}
      const available = await page.$(".buttondown");
      if (!_.isEmpty(available)) {
        const fileName = `${response.search} - ${new Date()}`;
        page = await downloadLegend(page, fileName, response.search);
        try {
          fs.createReadStream(path.resolve(`${dir}/${fileName}.zip`))
            .pipe(unzip.Extract({path: path.resolve(`${dir}`) }));

        } catch (error) {
          console.error(error.message);
        }
      } else {
        console.info("Download is not available");
      }
    }
    spinner.start();

    spinner.text = "Downloading torrent";
    await download(magnetLink, spinner, dir);
    spinner.succeed();

    await browser.close();
    process.exit();
  } catch (error) {
    console.error(error.message);
  }
})();
