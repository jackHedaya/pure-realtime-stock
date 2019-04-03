const RealtimeStock = require("../index");

const realtime = new RealtimeStock();

realtime.getPrice("ROKU").then(x => {
  console.log(x);
  realtime.close();
});