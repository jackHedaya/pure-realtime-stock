const RealtimeStock = require("../index");

const realtime = new RealtimeStock();

realtime.on("priceMoved", x => console.log(x));
realtime.on("debug", x => console.log(x));

realtime.subscribe("NIO");
realtime.subscribe("AMZN");
realtime.subscribe("SQ");
realtime.subscribe("AAPL");

setTimeout(function() {
  realtime.unsubscribe("AMZN");
}, 2000);

setTimeout(function() {
  realtime.unsubscribe("SQ");
}, 6000);

setTimeout(function () {
  realtime.close();
}, 12000);