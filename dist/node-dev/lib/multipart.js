
//var base64 = require("base64-stream");
var Multipart = require('multipart-stream')


var defs = {
  DEFAULT_BOUNDARY: "BOUNDARY",
  DEFAULT_CONTENT_TYPE: "multipart/mixed",
  LINE_BREAK: '\r\n'
};

/**
 * A basic multipart/mime handling object
 */

function MultipartHandler() {
  if (!(this instanceof MultipartHandler)) {
    throw new TypeError("Failed to construct MultipartHandler: Please use the _new_ operator, this object constructor cannot be called as a function.");
  }

  // initialisation
  this.data = [];
  this.boundary = defs.DEFAULT_BOUNDARY;
  this.contentType = defs.DEFAULT_CONTENT_TYPE;
};

MultipartHandler.prototype.getHeaders = function() {
  return {
    "Content-type": (this.contentType + "; boundary=" + this.boundary)
  };
};

MultipartHandler.prototype.append = function(uri,blob,mime) {
  this.data.push({uri: uri,blob: blob,mime: mime});
};

MultipartHandler.prototype.pipe = function(httpRequest) {
  /*
  for (var i = 0;i < this.data.length;i++) {
    // uri first, then blob. blob have their own mime type internally
    // boundary first
    httpRequest.write("--" + this.boundary + defs.LINE_BREAK);
    // content type
    if (null != this.data[i].mime && 0 != this.data[i].mime.length) {
      httpRequest.write("Content-type: " + this.data[i].mime + defs.LINE_BREAK);
    }
    // content disposition and filename
    httpRequest.write("Content-disposition: attachment; filename=" + this.data[i].uri + defs.LINE_BREAK);
    //httpRequest.write("Content-Transfer-Encoding: binary" + defs.LINE_BREAK);
    //httpRequest.write("Content-length: " + (this.data[i].blob.length + defs.LINE_BREAK.length) + defs.LINE_BREAK + defs.LINE_BREAK);
    // content itself
    //httpRequest.write(this.data[i].blob);
    this.data[i].blob.pipe(httpRequest); // TODO determine encoding for binary within http stream // .pipe(base64.encode())
    httpRequest.write(defs.LINE_BREAK);
  }
  // final bondary
  httpRequest.write("--" + this.boundary + "--" + defs.LINE_BREAK);*/
  var mps = new Multipart(this.boundary);
  for (var i = 0;i < this.data.length;i++) {
    var d = this.data[i];
    mps.addPart({
	    // by default no headers are set
	    headers: {
		    'Content-Type': d.mime,
        'Content-disposition': "attachment; filename=\"" + d.uri + "\""
	    },
	    // pass either a string, a buffer or a readable stream
	    body: d.blob
    });
  }
  mps.pipe(httpRequest);
};


// public API
module.exports = MultipartHandler;
