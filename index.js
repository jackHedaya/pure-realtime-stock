const puppeteer = require("puppeteer");
const EventEmitter = require("events").EventEmitter;

class RealtimeStock extends EventEmitter {
  constructor() {
    super();

    if (!this.browser) this.browser = puppeteer.launch({ headless: true });

    this.subscriptions = [];
  }

  /**
   * handles the pulling and updating of stock price changes
   * @access should not be used externally
   * @param {string} stock a stock ticker
   */
  async _run(stock) {
    const s = stock.toUpperCase();

    try {
      const browser = await this.browser;

      const page = await browser.newPage();

      await page.goto(`https://finance.yahoo.com/quote/${stock}`);

      await page.exposeFunction("emitEvent", async () => {
        const element = await page.$('span[data-reactid="34"]:nth-child(1)');
        const handler = await element.getProperty("textContent");
        const value = await handler.jsonValue();

        this.emit("priceMoved", { stock: stock, price: parseFloat(value.replace(/,/g, "")) });
      });

      await page.evaluate(function() {
        var target = document.querySelector('span[data-reactid="34"]:nth-child(1)');
        var observer = new MutationObserver(emitEvent);
        var config = { characterData: true, attributes: false, childList: false, subtree: true };

        observer.observe(target, config);
      });
    } catch (e) {
      this.emit("logs", e);
      this.emit("debug", `Getting ${s} price failed. See 'logs' to get the error message`);
    }
  }

  /**
   * subscribe to a stock's price changes
   * @param {string} stock a stock ticker
   */
  async subscribe(stock) {
    const s = stock.toUpperCase();

    this.subscriptions.push(s);
    this.emit("debug", `Subscribing to ${s}.`);

    await this._run(stock);
  }

  /**
   * unsubscribe from a subscribed stock price changes
   * @note errors may occur in `logs` while unsubscribing
   * @param {string} stock a stock ticker
   */
  async unsubscribe(stock) {
    const s = stock.toUpperCase();

    const pageIndex = this.subscriptions.indexOf(s);

    if (pageIndex !== -1) {
      this.subscriptions.splice(pageIndex, 1);
      this.emit("debug", `Unsubscribed from ${s}.`);
    } else {
      this.emit("debug", `${s} is not a subscription.`);
      return;
    }

    const browser = await this.browser;

    const pages = await browser.pages();

    await pages[pageIndex + 1].close();
  }

  /**
   * get the current stock price
   * @param {string} stock
   */
  async getPrice(stock) {
    const s = stock.toUpperCase();

    try {
      const browser = await this.browser;

      const page = await browser.newPage();

      await page.setRequestInterception(true);

      page.on("request", req => {
        const skip = ["stylesheet", "font", "image", "script"];
        const resourceType = req.resourceType();

        if (skip.includes(resourceType)) {
          this.emit("debug", `Skipping resource of type '${resourceType}' while accessing ${s} price.`);
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(`https://finance.yahoo.com/quote/${stock}`);

      return await page.evaluate(() => {
        return document
          .querySelector("#quote-market-notice")
          .parentElement.querySelector("span")
          .textContent.replace(/,/g, "");
      });
    } catch (e) {
      this.emit("logs", e);
      this.emit("debug", `Getting ${s} price failed. See 'logs' to get the error message`);
    }
  }

  /**
   * closes the connection with Yahoo Finance. if not ran, the program will not exit
   */
  async close() {
    (await this.browser).close();
  }
}

module.exports = RealtimeStock;
