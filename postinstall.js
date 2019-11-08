const chalk = require("chalk");

if (process.platform === "linux") {
  console.log(
    chalk.yellow(
      "Hey, a Linux OS was detected. For pure-realtime-stock to function properly, Puppeteer's dependencies need to be installed."
    )
  );

  console.log(
    chalk.bold.yellow("Dependencies can be installed with ") +
      chalk.bold.white("sh node_modules/pure-realtime-stock/deps.sh\n")
  );
  
  console.log(chalk.yellow("If there is an error during installation, delete node_modules and try again with "))
  console.log(chalk.bold.white("sudo npm i pure-realtime-stock --unsafe-perm=true"))
}
