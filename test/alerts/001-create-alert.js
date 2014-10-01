var mljs = require("mljs"),
    tests = exports,
    restify = require("restify"),
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-create-alert.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-create-alert.log' })
       ]
     });

      var db = new mljs(); // default options
  configurator.configure(db);
      db.setLogger(logger);


describe("001-create-alert",function() {

  describe("#saveBasicSearch() registering new alert", function(){

    it("Uses rest extension",function(done){

      db.saveBasicSearch("test-basic",true,"wibble",function(result) {

        logger.debug("RESULT: " + JSON.stringify(result));
        logger.debug("RESULT inError?: " + result.inError);
        assert(!result.inError,"saveBasicSearch() should not be in error: " + JSON.stringify(result));


        done();

      });
    });
  });

  describe("#saveCollectionSearch() registering new alert", function() {
    it("Uses rest extension",function(done) {
      db.saveCollectionSearch("test-collection",true,"wibbleCollection",function(result) {


        logger.debug("RESULT: " + JSON.stringify(result));
        logger.debug("RESULT inError?: " + result.inError);
        assert(!result.inError,"saveCollectionSearch() should not be in error: " + JSON.stringify(result));


        done();

      });
    });
  });



var AlertServer = function(alertListenPort,done) {
  this.port = alertListenPort;

  var self = this;

  function respond(req, res, next) {
    //res.send('hello client ' + req.params.clientid);
    //console.log("Received REST message");

    // determine which node the message is for
    /*var node = req.params.clientid;
    var client = self.getClient(node);

    if (null != client && undefined != client.websocket) {
      //console.log("Sending client node '" + node + "' message: '" + req.body.toString() + "'") // TESTED - WORKS A TREAT!
      client.websocket.sendUTF(JSON.stringify({response: "alert", content: req.body.toString()})); // TESTED - WORKS A TREAT! - TODO check this works fine for XML too
      // TODO do we want to send a multipart that describes the data???
    }*/

    logger.debug("RECEIVED ALERT!");

    res.send("OK");

    done();

    self.close();

  };

  this.server = restify.createServer({name: "MLJSAlertServer"});
  this.server.use(restify.bodyParser()); // { mapParams: false }

  // Server request 1: handle echo directly to client
  //server.get('/echo/:clientid', respond);
  //server.head('/echo/:clientid', respond);
  this.server.post('/alert/:clientid', respond);

  var self = this;
  this.server.listen(this.port, function() {
    logger.debug((new Date()) + ' - MLJS Alert Receiving HTTP Server listening at %s', self.server.url);
  });

  logger.debug("Created alert server");
};

AlertServer.prototype.close = function() {
  this.server.close();
};


  describe("#saveGeoNearSearch() registering new alert",function() {
    it("Uses rest extension",function(done) {
      db.saveGeoNearSearch("test-geonear",true,{type: "element",ns: "",element: "location"},0,0,5,function(result) {


        logger.debug("RESULT: " + JSON.stringify(result));
        logger.debug("RESULT inError?: " + result.inError);
        assert(!result.inError,"saveGeoNearSearch() should not be in error: " + JSON.stringify(result));


        done();

      });
    });
  });

  describe("#subscribe() registering new basic alert",function() {
    it("Uses rest extension",function(done) {
      // set up server to listen for notifications
      var as = new AlertServer(9898,done);

  var sleep = require('sleep');
  sleep.sleep(10);

      // then subscribe
      logger.debug("calling subscribe for test-basic");
      db.subscribe(as.server.url + "/alert/1.xml","test-basic",{},"json",function(result) {

        logger.debug("RESULT: " + JSON.stringify(result));
        logger.debug("RESULT inError?: " + result.inError);
        assert(!result.inError,"subscribe() for basic should not be in error: " + JSON.stringify(result));


        // then fire
        db.save({content:"some wibble test"},"/alerttest/basic.json",{format: "json"},function(result) {


          logger.debug("RESULT: " + JSON.stringify(result));
          logger.debug("RESULT inError?: " + result.inError);
          assert(!result.inError,"db.save() for basic should not be in error: " + JSON.stringify(result));

          logger.debug("Awaiting alert...");

        });

      });
    });
  });

});
