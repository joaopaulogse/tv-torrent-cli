module.exports = async (page, search) => {
  try {
    await page.waitFor("#searchinput");
  } catch (error) {
    await page.close();
  }
  await page.type("#searchinput", search);
  await page.click("button[type='submit']");
  return page;
};
