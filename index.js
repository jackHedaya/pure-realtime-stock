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
      this.emit("debug", `Getting ${stock.toUpperCase()} price failed. See 'logs' to get the error message`);
    }
  }

  /**
   * subscribe to a stock's price changes
   * @param {string} stock a stock ticker
   */
  async subscribe(stock) {
    this.subscriptions.push(stock);
    this.emit("debug", `Subscribing to ${stock.toUpperCase()}.`);

    await this._run(stock);
  }

  /**
   * unsubscribe from a subscribed stock price changes
   * @note errors may occur in `logs` while unsubscribing
   * @param {string} stock a stock ticker
   */
  async unsubscribe(stock) {
    const pageIndex = this.subscriptions.indexOf(stock);

    if (pageIndex !== -1) {
      this.subscriptions.splice(pageIndex, 1);
      this.emit("debug", `Unsubscribed from ${stock.toUpperCase()}.`);
    } else {
      this.emit("debug", `${stock.toUpperCase()} is not a subscription.`);
      return;
    }

    const browser = await this.browser;

    const pages = await browser.pages();

    await pages[pageIndex + 1].close();
  }
}

module.exports = RealtimeStock;
