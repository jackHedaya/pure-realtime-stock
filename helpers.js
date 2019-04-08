/**
 *
 * @param {import("puppeteer").Page} page
 */
exports.scrapePrice = page => {
  return page.evaluate(() => {
    return parseFloat(
      document
        .querySelector("#quote-market-notice")
        .parentElement.querySelector("span")
        .textContent.replace(/,/g, "")
    );
  });
};

/**
 * @param {import("puppeteer").Page} page the Chromium page to block resources
 * @param {string[]} skip the resource types to skip
 * @param {function(string) : void} callback called when a resource is blocked, passes the blocked resource type
 */
exports.blockResources = async (page, skip, callback) => {
  await page.setRequestInterception(true);

  page.on("request", req => {
    const resourceType = req.resourceType();

    if (skip.includes(resourceType)) {
      callback(resourceType);

      req.abort();
    } else {
      req.continue();
    }
  });
};
