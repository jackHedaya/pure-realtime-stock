const puppeteer = require('puppeteer')
const EventEmitter = require('events').EventEmitter

const { scrapePrice, blockResources, isLinux } = require('./helpers')

class RealtimeStock extends EventEmitter {
  constructor() {
    super()

    if (!this.browser)
      this.browser = puppeteer.launch({ headless: true, args: isLinux() ? ['--no-sandbox'] : undefined })

    this.subscriptions = []
  }

  /**
   * handles the pulling and updating of stock price changes
   * @access should not be used externally
   * @param {string} stock a stock ticker
   */
  async _run(stock) {
    const s = stock.toUpperCase()

    try {
      const browser = await this.browser

      const page = await browser.newPage()

      await page.goto(`https://robinhood.com/stocks/${stock}`)

      await blockResources(page, ['stylesheet', 'font', 'image'], resourceType =>
        this.emit('debug', `Skipping resource of type '${resourceType}' while accessing ${s} information.`)
      )

      await page.exposeFunction('emitEvent', async () => {
        const price = await scrapePrice(page)

        this.emit('priceMoved', { stock: stock, price: price })
      })

      await page.evaluate(function() {
        var target = document.querySelector('.up > div:first-child > div,.down > div:first-child > div')

        var observer = new MutationObserver(emitEvent)
        var config = { characterData: true, attributes: false, childList: false, subtree: true }

        observer.observe(target, config)
      })
    } catch (e) {
      this.emit('logs', e)
      this.emit('debug', `Getting ${s} price failed. See 'logs' to get the error message`)
    }
  }

  /**
   * subscribe to a stock's price changes
   * @param {string} stock a stock ticker
   */
  async subscribe(stock) {
    const s = stock.toUpperCase()

    this.subscriptions.push(s)
    this.emit('debug', `Subscribing to ${s}.`)

    await this._run(stock)
  }

  /**
   * unsubscribe from a subscribed stock price changes
   * @note errors may occur in `logs` while unsubscribing
   * @param {string} stock a stock ticker
   */
  async unsubscribe(stock) {
    const s = stock.toUpperCase()

    const pageIndex = this.subscriptions.indexOf(s)

    if (pageIndex !== -1) {
      this.subscriptions.splice(pageIndex, 1)
      this.emit('debug', `Unsubscribed from ${s}.`)
    } else {
      this.emit('debug', `${s} is not a subscription.`)
      return
    }

    const browser = await this.browser

    const pages = await browser.pages()

    await pages[pageIndex + 1].close()
  }

  /**
   * get the current stock price
   * @param {string} stock a stock ticker
   */
  async getPrice(stock) {
    const s = stock.toUpperCase()

    try {
      const browser = await this.browser

      const page = await browser.newPage()

      await page.goto(`https://robinhood.com/stocks/${stock}`)

      await blockResources(page, ['stylesheet', 'font', 'image', 'script'], resourceType =>
        this.emit('debug', `Skipping resource of type '${resourceType}' while accessing ${s} price.`)
      )

      await page.waitForSelector('.up,.down')
      const price = await scrapePrice(page)

      await page.close()

      return price
    } catch (e) {
      this.emit('logs', e)
      this.emit('debug', `Getting ${s} price failed. See 'logs' to get the error message`)
    }
  }

  /**
   *
   * @param {string} stock a stock ticker
   */
  async getInformation(stock) {
    const s = stock.toUpperCase()

    try {
      const browser = await this.browser

      const page = await browser.newPage()

      await page.goto(`https://robinhood.com/stocks/${stock}`)

      await blockResources(page, ['stylesheet', 'font', 'image', 'script'], resourceType =>
        this.emit('debug', `Skipping resource of type '${resourceType}' while accessing ${s} information.`)
      )

      const info = await page.evaluate(() => {
        return [...document.querySelectorAll('.grid-4 ._3NzV9cihCJfQKoeSaerZiq')].reduce((acc, outer) => {
          const [e1, e2] = outer.childNodes
          const x = Object.assign({}, acc, { [e1.textContent]: e2.textContent })
          return x
        }, {})
      })

      await page.close()

      return info
    } catch (e) {
      this.emit('logs', e)
      this.emit('debug', `Getting ${s} stock information failed. See 'logs' to get the error message`)
    }
  }

  /**
   * closes the connection with Yahoo Finance. if not ran, the program will not exit
   */
  async close() {
    ;(await this.browser).close()
  }
}

module.exports = RealtimeStock
