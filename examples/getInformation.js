const RealtimeStock = require("../index");

const realtime = new RealtimeStock();

realtime.getInformation("pcg").then(info => {
  console.log(info);
  realtime.close();
});

realtime.on("debug", x => console.log(x));