var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    url = require('url'),
    mljs = require('mljs');

// Provides a set of classes and server framework to run MLJS powered HTML5 apps with WebSocket and alerting support in a Node.js web server.

var ConnectionManager = function() {
  this.clients = new Array();
  this.nextID = 1;
};

ConnectionManager.prototype.registerClient = function(websocket,securityInfo) {
  var self = this;
  var newID = "" + this.nextID++; // TODO add NOW timezone to id with hyphen
  var client = {
    id: newID,
    security: securityInfo,
    websocket: websocket
  };
  this.clients.push(client);
  return client.id;
};

ConnectionManager.prototype.unregisterClient = function(id) {
  var newClients = new Array();
  for (var i = 0, max = this.clients.length,client;i < max;i++) {
    client = this.clients[i];
    if (id == client.id) {
      // don't add
    } else {
      newClients.push(client);
    }
  }
  this.clients = newClients;
};

ConnectionManager.prototype.getClient = function(id) {
  for (var i = 0, max = this.clients.length,client;i < max;i++) {
    client = this.clients[i];
    if (id == client.id) {
      return client;
    }
  }
  return null;
};



var AlertServer = function(alertListenPort,connectionManager) {
  this.port = alertListenPort;
  this.manager = connectionManager;

  // REST SERVER ENDPOINT for passing on alerts

  var restify = require('restify');

  var self = this;

  function respond(req, res, next) {
    //res.send('hello client ' + req.params.clientid);
    //console.log("Received REST message");

    // determine which node the message is for
    var node = req.params.clientid;
    var client = self.getClient(node);

    if (null != client && undefined != client.websocket) {
      //console.log("Sending client node '" + node + "' message: '" + req.body.toString() + "'") // TESTED - WORKS A TREAT!
      client.websocket.sendUTF(JSON.stringify({response: "alert", content: req.body.toString()})); // TESTED - WORKS A TREAT! - TODO check this works fine for XML too
      // TODO do we want to send a multipart that describes the data???
    }

    res.send("OK");

  };

  this.server = restify.createServer({name: "MLJSAlertServer"});
  this.server.use(restify.bodyParser()); // { mapParams: false }

  // Server request 1: handle echo directly to client
  //server.get('/echo/:clientid', respond);
  //server.head('/echo/:clientid', respond);
  this.server.post('/alert/:clientid', respond);

  var self = this;
  this.server.listen(this.port, function() {
    console.log((new Date()) + ' - MLJS Alert Receiving HTTP Server listening at %s', self.server.url);
  });
};

AlertServer.prototype.close = function() {
  this.server.close();
};



var WebServer = function(port,connectionManager,appBaseDirectory,restServer,restPort,defaultPath) {
  this.port = port;
  this.manager = connectionManager;
  this.base = appBaseDirectory;
  this.defaultPath = defaultPath;

  // require here in case some things aren't supported
  var WebSocketServer = require('websocket').server;
  var fs = require('fs');

  var self = this;

  // HTTP SERVER FIRST

  var mimes = {
    xml: "text/xml", txt: "text/plain", html: "text/html; charset=UTF-8", png: "image/png", jpg: "image/jpeg", gif: "image/gif", js: "text/javascript", css: "text/css"
  }; // TODO get MIMEs supported from MarkLogic server


function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
};

  this.httpServer = http.createServer(
    // TODO handle AUTH immediately, shadowed from MarkLogic Server

  function(request, res) {
    console.log((new Date()) + ' Received request for ' + request.url);

      // check and set cookie with client id
      var cookies = parseCookies(request);
      var cookie = cookies["mljsWebServerClientId"];
      // TODO fix cookie to IP address of originator
      var clientid = cookie;
      if (null == cookie) {
        // create client reference
        clientid = self.manager.registerClient(null,null); // TODO security auth info from HTTP auth call(s)
      }
      var client = self.manager.getClient(clientid);

    if (0 == request.url.indexOf("/v1/")) { // TODO future proof versioned URLs
      // forward on to REST API
      // TODO USE MLJS INTERNAL CONNECTION MANAGERS TO HANDLE CONNECTION AND AUTH

      // use connection to send request. Pass on response to listener
      var options = {
        host: restServer,
        port: restPort,
        path: request.url,
        method: request.method
        ,headers: request.headers
      };
      console.log("Sending REST request to: " + options.method + " " + options.host + ":" + options.port + options.path);

      // TODO if it's our MLJS alerts extension being called then add the server alert URL parameter encoded to the request URL (override one from app if present)

      var creq = http.request(options,function (response) {
        console.log("REST HTTP Request callback called");

        // TODO handle authentication response from REST server, and pass on to client


          // Check for HTTP 401 Unauthorized header
          if (401 == response.statusCode) {
            // determine authorisation method and cache in connection
            var reqAuth = response.headers["www-authenticate"];
            console.log("HTTP 401 Unauthorized received. Auth request header: " + reqAuth);
            console.log("HTTP 401 Unauthorized received. All headers: " + JSON.stringify(response.headers));
            var firstSpace = reqAuth.indexOf(" ");
            var reqMethod = reqAuth.substring(0,firstSpace);
            console.log("Auth method: " + reqMethod);
            /*var reqRemainder = reqAuth.substring(firstSpace + 1);
            var reqVars = {};
            var parts = reqRemainder.split(",");
            for (var p = 0,maxp = parts.length,part,els;p < maxp;p++) {
              part = parts[p];
              els = part.split("=");
              els[0] = els[0].trim();
              els[1] = els[1].trim();
              if (els[1].substring(0,1) == "\"") {
                els[1] = els[1].substring(1);
              }
              if (els[1].substring(els[1].length - 1,els[1].length) == "\"") {
                els[1] = els[1].substring(0,els[1].length - 1);
              }
              //els[1] = els[1].substring(1,els[1].length - 1);
              reqVars[els[0]] = els[1];
            }
            for (var reqVarName in reqVars) {
              console.log("Auth Var: " + reqVarName + " = " + reqVars[reqVarName]);
            }*/
            // send on response to client request
            res.writeHead(response.statusCode, {
              'Content-Type': response.headers["Content-Type"],
              'Set-Cookie': 'mljsWebServerClientId=' + clientid,
              'www-authenticate': reqAuth
            });
          } else {
            console.log("Got response from REST server: " + response.statusCode);
            console.log("  Content-Type: " +  response.headers["Content-Type"] + " Content-type: " +  response.headers["Content-type"]);
            var headers = {'Set-Cookie': 'mljsWebServerClientId=' + clientid};
            if (undefined != response.headers["Content-Type"]) {
              headers["Content-Type"] = response.headers["Content-Type"];
            }
            res.writeHead(response.statusCode, headers);
            //console.log(data);
            //if (data.length > 0) {
              //console.log("writing data: " + data);
            //  res.write(data,"binary");
            //}
          }
          //res.end();
          console.log("End of sending rest proxy response");

        var data = "";
        response.on('data', function(chunk) {
          //console.log("REST proxy data(chunk): " + chunk);
          //data += chunk;
          res.write(chunk,"binary");
        });

        var complete = function() {


        };

        response.on('end', function() {
          console.log("REST proxy end()");
          complete();
          res.end();
        }); // response end callback
        response.on('close', function() {
          console.log("REST proxy close()");
          complete();
          res.close();
        }); // response end callback
        response.on('error', function() {
          console.log("REST proxy error()");
          complete();
          res.error();
        }); // response end callback


    if (options.method == "PUT" || options.method == "DELETE") {
  //    console.log("Forcing call to PUT or DELETE");
//      complete();
    }

      }); // request response callback

      // send request data as necessary

      request.on('data', function(chunk) {
        console.log('HTTP REST PROXY: GOT REQUEST DATA: Got %d bytes of data: ' + chunk, chunk.length);
        creq.write(chunk);
      });

      creq.on("error",function(e) {
        console.log("creq: REQUEST ERROR: " + e);
      });
      //creq.write("\n");
      request.on("end", function() {
        console.log("Calling REST client request.end()");
        creq.end();
      });






      /*

    } else if (0 == request.url.indexOf("/user/status")) {








  app.get('/user/status', function(req, res) {
    if (req.session.user === undefined) {
      res.send('{"authenticated": false}');
    }
    else {
      res.send(req.session.user);
    }
  });







} else if (0 == request.url.indexOf("/user/login")) {

    // Attempt to read the user's profile, then check the response code.
    // 404 - valid credentials, but no profile yet
    // 401 - bad credentials
    var body = JSON.stringify({ // TODO NEVER EVER FORCE CLIENT TO USER URL PARAMETERS FOR PASSWORD AS THEY CAN BE REVEALED FROM URL HASH
      user: req.param('username'),
      password: req.param('password')
    });

    var headers = req.headers;
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(body, 'utf8');
    var o = {
        host: restServer,
        port: restPort,
      path: '/v1/resources/auth',
      headers: headers,
      method: 'POST'
    };
    var login = http.request(o, function(response) {
      if (response.statusCode === 401) {
        // res.redirect('/login/');
        res.status(401).send(); // TODO send failure message
      }
      else {
        if (response.statusCode === 200) {
          // authentication successful, remember the user
          response.on('data', function(chunk) {
            var user = JSON.parse(chunk);
            req.session.user = user; // TODO use the user param of JSON response, not the whole thing as a string
            res.status(200).send(user); // TODO this code looks buggy if the chunk size is small. Verify and fix as necessary
          });
        }
      }
    });

    login.on('error', function(e) {
      console.log(e);
      console.log('login failed: ' + e.statusCode);
    });

    //login.end(body);

      request.on('data', function(chunk) {
        console.log('HTTP REST PROXY: GOT REQUEST DATA: Got %d bytes of data: ' + chunk, chunk.length);
        login.write(chunk);
      });

      //creq.write("\n");
      request.on("end", function() {
        console.log("Calling REST client request.end()");
        login.end();
      });









} else if (0 == request.url.indexOf("/user/logout")) {
    delete req.session.user;
    // res.clearCookie('user');
    //res.send();

          res.writeHead(200, {
            'Content-Type': mime
            'Set-Cookie': 'mljsWebServerClientId=0'
          });
          //console.log(data);
          res.write();
          res.end();




*/



  } else /* if (request.url.indexOf("/public/") == 0) */ {


      console.log("Web application static files requested");
      // get relative file path
      var path = self.base + url.parse(request.url).pathname;

      // determine MIME from file ext
      var dotpos = path.lastIndexOf(".");
      var ext = path.substring(dotpos + 1);
      var mime = mimes[ext];


      // return file
      console.log("Fetching file: " + path);
      fs.readFile(path, function (err, data) {
        if (err) {
          console.log("404 File Not Found: " + path);
          if (undefined != defaultPath) {
            fs.readFile(self.base + defaultPath,function (err2,data2) {
              if (err2) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write("<html><head><title>404 not found</title></head><body><h1>File Not Found</h1></body></html>");
                res.end();
                // 404
              } else {
          res.writeHead(200, {
            'Content-Type': mime,
            'Transfer-Encoding': 'chunked',
            'Set-Cookie': 'mljsWebServerClientId=' + clientid
          });
          //console.log(data);
          res.write(data2);
          res.end();
              }
            });
          } else {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.write("<html><head><title>404 not found</title></head><body><h1>File Not Found</h1></body></html>");
            res.end();
          }
        } else {
          // write header and content type
          res.writeHead(200, {
            'Content-Type': mime,
            'Transfer-Encoding': 'chunked',
            'Set-Cookie': 'mljsWebServerClientId=' + clientid
          });
          //console.log(data);
          res.write(data);
          res.end();
        }
      });
    /*} else {
      res.writeHead(404);
      res.end();
      */
    }
  }
);
this.httpServer.listen(this.port, function() {
    console.log((new Date()) + ' - MLJS Web Server is listening on port ' + self.port);
});

  // WEBSOCKETS SERVER NOW
// SET UP CLIENT WEB SOCKETS SERVER

  this.wsServer = new WebSocketServer({
    httpServer: self.httpServer,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
  });

  function originIsAllowed(origin) {
    // TODO put logic here to detect whether the specified origin is allowed - has session cookie and correct IP
    return true;
  };

  this.wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' - MLJS Web Server Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var socketClientConnection = request.accept('mljs-alerts', request.origin);


    console.log((new Date()) + ' - MLJS Web Server Connection accepted.');

    // TODO get client id from web server cookie (from http original page request)

      // Client request type 1: Receive a random message - reflect back to client
      socketClientConnection.on('message', function(message) {
        if (message.type === 'utf8') {


          // NA to be done as REST extension handle combined query submitted as JSON document string {request: "search", content: combinedQueryJson}

          // NA to be done as REST extension also handle {request: "subscribe", content: combinedQueryJson}

          // handle {request: "test"}
          var json = JSON.parse(message.stringData); // TODO verify this is right line
          if ("test" == json.request) {
            socketClientConnection.sendUTF(JSON.stringify({response:"test"}));
          } else if ("subscribe" == json.request) {
            // NA do via rest call instead
          } else if ("search" == json.request) {
            // NA do via rest call instead
          }

        }
        else if (message.type === 'binary') {
            console.log(' - MLJS Web Server Received Binary Message of ' + message.binaryData.length + ' bytes');
            socketClientConnection.sendBytes(message.binaryData); // TODO why are we replaying this?

        }
      });

      socketClientConnection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' - MLJS Web Server Peer ' + socketClientConnection.remoteAddress + ' disconnecting...');

        // TODO Unsubscribe from ML location intel


        console.log((new Date()) + ' - MLJS Web Server Peer ' + socketClientConnection.remoteAddress + ' disconnected.');
      });
    });

};



// now overall MLJSServer object

var MLJSWebServer = function(webPort,alertPort,appBaseDirectory,restServer,restPort,defaultPath) {
  this.manager = new ConnectionManager();
  this.webServer = new WebServer(webPort,this.manager,appBaseDirectory,restServer,restPort,defaultPath); // TODO support this
  this.alertServer = new AlertServer(alertPort,this.manager);
};

MLJSWebServer.prototype.close = function() {
  this.webServer.close();
  this.alertServer.close();
};

module.exports =
 {
    MLJSWebServer: MLJSWebServer,
    AlertServer: AlertServer,
    WebServer: WebServer,
    ConnectionManager: ConnectionManager
  };
