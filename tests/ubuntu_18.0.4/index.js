const realtime = require("pure-realtime-stock");

realtime.getInformation("ROKU").then(info => {
  console.log(info);
  realtime.close();
 });