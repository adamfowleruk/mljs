




var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
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
  clients.push(client);
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
      client.websocket.sendUTF(req.body.toString()); // TESTED - WORKS A TREAT!
      // TODO do we want to send a multipart that describes the data???
    }
  
    res.send("OK");
  
  };
  
  this.server = restify.createServer();
  server.use(restify.bodyParser()); // { mapParams: false }
  
  // Server request 1: handle echo directly to client
  //server.get('/echo/:clientid', respond);
  //server.head('/echo/:clientid', respond);
  server.post('/alert/:clientid', respond);
  
  
  server.listen(this.port, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
};

AlertServer.prototype.close = function() {
  this.server.close();
};






var WebServer = function(port,connectionManager,appBaseDirectory,restServer,restPort) {
  this.port = port;
  this.manager = connectionManager;
  this.base = appBaseDirectory;
  
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
      var clientid = cookie;
      if (null == cookie) {
        // create client reference
        clientid = manager.registerClient(socketClientConnection,null); // TODO security auth info from HTTP auth call(s)
      }
      var client = manager.getClient(clientid);
      
    if (0 == request.url.indexOf("/v1/")) { // TODO future proof versioned URLs
      // forward on to REST API
      
      // USE MLJS INTERNAL CONNECTION MANAGERS TO HANDLE CONNECTION AND AUTH
      var conn = client.rest;
      
      if (null == conn) {
        // TODO set up new connection, caching for later in client object
        // NA - http connection stateless in this case
      }
      
      // use connection to send request. Pass on response to listener
      var options = {
        hostname: restServer,
        port: restPort,
        path: request.url,
        method: request.method
      };
      http.request(options,function (response) {
        var data = [];
      response.on('data', function(chunk) {
        data.push(chunk);
      });
      response.on('end', function() {
        
        
          res.writeHead(response.statusCode, {
            'Content-Type': response.getHeader("Content-Type"), 
    'Set-Cookie': 'mljsWebServerClientId=' + clientid,
          });
          //console.log(data);
          if (response.data.length > 0) {
            res.write(data);
          }
          res.end();
        
        
        return result;
      }); // response end callback
      }); // request response callback
      
    } else /* if (request.url.indexOf("/public/") == 0) */ {
      
      
      console.log("Public files requested");
      // get relative file path
      var path = base + request.url;
      
      // determine MIME from file ext
      var dotpos = path.lastIndexOf(".");
      var ext = path.substring(dotpos + 1);
      var mime = mimes[ext];
      
      
      // return file
      console.log("Fetching file: " + path);
      fs.readFile(path, function (err, data) {
        if (err) { 
          console.log("404 File Not Found: " + path);
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.write("<html><head><title>404 not found</title></head><body><h1>File Not Found</h1></body></html>");
          res.end();
        } else {
          // write header and content type
          res.writeHead(200, {
            'Content-Type': mime, 
            'Transfer-Encoding': 'chunked',
    'Set-Cookie': 'mljsWebServerClientId=' + clientid,
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
    console.log((new Date()) + ' Server is listening on port 8080');
});



  // WEBSOCKETS SERVER NOW
    
    
// SET UP CLIENT WEB SOCKETS SERVER


  this.wsServer = new WebSocketServer({
    httpServer: httpServer,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
  });

  function originIsAllowed(origin) {
    // TODO put logic here to detect whether the specified origin is allowed.
    return true;
  };

  wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    
    
    var socketClientConnection = request.accept('mljs-alerts', request.origin);
    
    
    console.log((new Date()) + ' Connection accepted.');
    
    // TODO get client id from web server cookie (from http original page request)

      // Client request type 1: Receive a random message - reflect back to client
      socketClientConnection.on('message', function(message) {
        if (message.type === 'utf8') {
          // we've got a message - OUT OF SCOPE FOR THIS CONNECTOR - ONE WAY WEBSOCKETS ONLY
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            socketClientConnection.sendBytes(message.binaryData);
        }
      });
    
      socketClientConnection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + socketClientConnection.remoteAddress + ' disconnecting...');
        
        // TODO Unsubscribe from ML location intel
        
        
        console.log((new Date()) + ' Peer ' + socketClientConnection.remoteAddress + ' disconnected.');
      });
    });
    
    
  
  
};








// now overall MLJSServer object

var MLJSWebServer = function(webPort,alertPort,restServer,restPort,appBaseDirectory) {
  this.manager = new ConnectionManager();
  this.webServer = new WebServer(webPort,this.manager,appBaseDirectory,restServer,restPort); // TODO support this
  this.alertServer = new AlertServer(alertPort,this.manager);
};

MLJSWebServer.prototype.close = function() {
  this.webServer.close();
  this.alertServer.close();
};


module.exports = {
  MLJSWebServer: MLJSWebServer,
  AlertServer: AlertServer,
  WebServer: WebServer,
  ConnectionManager: ConnectionManager
};

