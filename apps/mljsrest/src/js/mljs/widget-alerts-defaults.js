

(function(){

//based on client.js:-
// the following are specified
var width = 1900;
var height = 1000;
/*
var latcentre = 52.9250249586409 ; // degree decimals
var loncentre = -0.521834795863905;
var latlonwidth = 0.35; // degree decimals -> use 0.3 for beckingham
var latlonheight = 0.35;

var radiusmiles = 5; // have this define the search criteria
*/

var latcentre = 53.10090689 ; // degree decimals
var loncentre = -0.715500;
var latlonwidth = 0.005; // degree decimals -> use 0.005 for beckingham
var latlonheight = 0.005;

var radiusmiles = 5; // have this define the search criteria


var settings = {
  enemy: {
    colour: "red"
  },
  friendly: {
    colour: "blue"
  }
};



// the following are calculated
var scalelat = 1; // multiplier to convert lat to y
var scalelon = 1; // multiplier to convert lon to x
var invscalelat = 1;
var invscalelon = 1;
var halfwidth = (1.0*width) / 2.0;
var halfheight = (1.0*height) / 2.0;

// calculation functions

var lltoxy = function(lat,lon) {
  // translate on to our centre
  var tlat = lat - latcentre;
  var tlon = lon - loncentre;

  //console.log("tlat: " + tlat + ", tlon: " + tlon);

  // scale
  var ty = scalelat * (-1.0 * tlat); // latitude increases upwards, y increases downwards
  var tx = scalelon * tlon;
  //console.log("ty: " + ty + ", tx: " + tx);

  // add our centre x/y
  var x = tx + halfwidth;
  var y = ty + halfheight;
  //console.log("y: " + y + " , x: " + x);

  return [x,y];
};

var xytoll = function(x,y) {
  var tx = x - halfwidth;
  var ty = y - halfheight;

  var tlat = invscalelat * ty * -1.0;
  var tlon = invscalelon * tx;

  return [tlat + latcentre,tlon + loncentre];
};

var calcScale = function() {
  scalelat = (1.0 * height) / latlonheight;
  //scalelon = (1.0 * width) / latlonwidth;
  scalelon = scalelat; // to maintain aspect ratio of imagery
  invscalelat = 1.0 / scalelat;
  invscalelon = invscalelat;
  console.log("Scale Lat: " + scalelat + ", Lon: " + scalelon);
  console.log("Inverse Scale Lat: " + invscalelat + ", Lon: " + invscalelon);

  // now refresh all sprites
  sprites.redrawAll();
};

calcScale();








// based on sprites.js:-

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = angleInDegrees * Math.PI / 180.0;
  var x = centerX + radius * Math.cos(angleInRadians);
  var y = centerY + radius * Math.sin(angleInRadians);
  return [x,y];
};

var sprites = {};
/* defined in clients.js
var collections = {
  ieds: new Array(),
  personnel: new Array(),
  friendlies: new Array(),
  enemies: new Array(),
  vehicles: new Array(),
  radars: new Array(),
  tiles: new Array(),
  targets: new Array(),
  gunfires: new Array()
};*/

sprites.redrawAll = function() {
  console.log("Redrawing all sprites");

  for (var i = 0;i < allsprites.length;i++) {
    console.log("Updating: " + allsprites[i].reading.id);
    allsprites[i].update(allsprites[i].reading);
  }
};

/** MAP TILES **/

/** generic drawing function that attemps to guess result object type **/
sprites.draw = function(uri,result) {
  if (result.ied) {
    var ied = new sprites.IED(uri,result);
    // add to on screen collection
    collections.ied.push(ied);
  } else {
    // TODO other types
  }
};





var readingmatcher = function(alertInfo) {
  // TODO match just readings
  return true; // assume true for test app
};

var readingsummary = function(alertInfo) {
  return "Alert for " + alertInfo.reading.type + " on " + alertInfo.reading.layer;
};


sprites.Tile = function(id,reading) {
  this.reading = reading;
  this.id = id;
};

sprites.Tile.matcher = readingmatcher;
sprites.Tile.summary = readingsummary;

sprites.Tile.prototype.renderSVG = function() {

  //console.log("showTile() start.");

  //console.log(JSON.stringify(alert.reading));

  // get position and convert to x and y coords
  //var centre = alert.reading.location.centre;
  //var latlon = centre.split(",");
  //console.log("latlon: " + latlon);
  //var xy = lltoxy(latlon[0],latlon[1]);
  //console.log("x: " + xy[0] + ", y: " + xy[1]);


  // draw image

  this.svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
  this.svgimg.setAttribute('id',this.id);
  this.svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href','data:image/png;base64,' + this.reading.data.base64);

  document.getElementById(this.reading.layer).appendChild(this.svgimg);

/*
svg.image('data:image/png;base64,' + alert.reading.data.base64,topleft[0],topleft[1],width,height);
*/

/*
var img = document.createElement("img");
img.setAttribute('height',100);
img.setAttribute('width',100);
img.setAttribute('id',alert.docuri);
img.setAttribute('src','data:image/png;base64,' + alert.reading.data.base64);
img.setAttribute('x',50);
img.setAttribute('y',50);

document.getElementById("page").appendChild(img);
  */
  //console.log("showTile() end.");

  this.updateSVG(this.reading);

};

sprites.Tile.prototype.updateSVG = function(reading) {
  this.reading = reading;

  // get top left and bottom right coords from bounding box
  var box = this.reading.location.box;
  var positions = box.split(" ");
  var topleft = lltoxy(positions[0],positions[1]);
  //console.log("Top Left x: " + topleft[0] + ", y: " + topleft[1]);

  var bottomright = lltoxy(positions[4],positions[5]);
  //console.log("Bottom Right x: " + bottomright[0] + ", y: " + bottomright[1]);

  // convert to pixels to get top left in x,y and width,height
  var width = Math.ceil(bottomright[0]) - Math.floor(topleft[0]);
  var height = Math.ceil(bottomright[1]) - Math.floor(topleft[1]);
  //console.log("Width: " + width + ", height: " + height);

  this.svgimg.setAttribute('height',height);
  this.svgimg.setAttribute('width',width);
  this.svgimg.setAttribute('x',Math.floor(topleft[0]));
  this.svgimg.setAttribute('y',Math.floor(topleft[1]));
};





/** PERSONNEL **/


sprites.Personnel = function(id,reading) {
  this.reading = reading;
  this.id = id;

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element

  this.colour = "red"; // middle red
  this.stroke = "darkred";
  if ("friendly" == this.reading.layer) {
    this.colour = "blue"; // middle green
    this.stroke = "darkblue";
  }
};

sprites.Personnel.matcher = readingmatcher;
sprites.Personnel.summary = readingsummary;

sprites.Personnel.prototype.renderSVG = function() {

  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.circle = document.createElementNS('http://www.w3.org/2000/svg','circle');

  // settings that are unlikely to change
  this.circle.setAttribute("fill",this.colour);
  this.circle.setAttribute("fill-opacity","0.75");
  this.circle.setAttribute("stroke",this.stroke);
  this.circle.setAttribute("stroke-width","1");

  document.getElementById("personnel").appendChild(this.circle);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.circle.appendChild(this.title);

  // update
  this.updateSVG(reading);

};

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.Personnel.prototype.updateSVG = function(reading) {
  this.reading = reading;

  // draw circle
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.circle.setAttribute('r',5);
  this.circle.setAttribute('id',this.id);
  this.circle.setAttribute('cx',Math.floor(xy[0]));
  this.circle.setAttribute('cy',Math.floor(xy[1]));

  var t = this.reading.time.indexOf("T");
  this.title.textContent = reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));
};

/**
 * Translation (movement) handled generically (centre of sprite to be used). Direction must be handled by sprite. i.e. where is this sprite pointed.
 */
sprites.Personnel.prototype.direction = function(dirDegrees) {

};

/**
 * Update this sprite because it's last reading is 'stale'
 */
sprites.Personnel.prototype.stale = function() {

};




/** RADAR **/

sprites.Radar = function(id,reading) {
  this.reading = reading;
  this.id = id;

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element

  this.colour = "red"; // middle red
  if ("friendly" == this.reading.layer) {
    this.colour = "blue"; // middle green
  }
};

sprites.Radar.matcher = readingmatcher;
sprites.Radar.summary = readingsummary;

sprites.Radar.prototype.renderSVG = function() {

  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');

  // settings that are unlikely to change
  this.rect.setAttribute("fill",this.colour);
  this.rect.setAttribute("fill-opacity","0.75");
  this.rect.setAttribute("stroke","darkblue");
  this.rect.setAttribute("stroke-width","1");

  document.getElementById("sensor").appendChild(this.rect);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.rect.appendChild(this.title);
  var t = this.reading.time.indexOf("T");
  this.title.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));

  // do start and end lines, and radius

  this.arc = document.createElementNS('http://www.w3.org/2000/svg','path');
  this.arc.setAttribute("stroke","blue");
  this.arc.setAttribute("stroke-width","1");
  this.arc.setAttribute("stroke-opacity","0.5");
  this.arc.setAttribute("fill-opacity","0.1");
  this.arc.setAttribute("fill","blue");
  document.getElementById("sensor").appendChild(this.arc);


  this.text = document.createElementNS('http://www.w3.org/2000/svg','text');
  this.text.setAttribute('id',this.id + "__text");
  this.text.setAttribute("font-size","6px");
  this.text.setAttribute("font-family","SVGFreeSansASCII,sans-serif");
  this.text.setAttribute("fill","white");
  this.text.textContent = "R";
  document.getElementById("sensor").appendChild(this.text);

  this.title2 = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.text.appendChild(this.title2);
  this.title2.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));


  // update
  this.updateSVG(reading);

};

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.Radar.prototype.updateSVG = function(reading) {
  this.reading = reading;
  // draw circle
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.rect.setAttribute('id',this.id);
  var x = Math.floor(xy[0]-4.0);
  var y = Math.floor(xy[1]-4.0);
  this.rect.setAttribute('x',x - 2);
  this.rect.setAttribute('y',y - 6);

  this.text.setAttribute('x',x);
  this.text.setAttribute('y',y);

  var range = scalelat * this.reading.range.nm / 60.0;
  var start = polarToCartesian(x,y,range,this.reading.arc.start - 90);
  var end = polarToCartesian(x,y,range,this.reading.arc.end - 90);
  this.arc.setAttribute("d","M" + x + "," + y + " L" + start[0] + "," + start[1] + " A" + range + "," + range + " " + (range * Math.cos((this.reading.arc.start - 90) * Math.PI / 180.0)) + " 0,1 " + end[0] + "," + end[1] + " L" + x + "," + y + " Z");

  this.rect.setAttribute('width',8);
  this.rect.setAttribute('height',8);
};

/** IED **/

sprites.IED = function(id,reading) {
  this.reading = reading;
  this.id = id;

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element

  this.colour = "green";
  if ("active" == this.reading.status) {
    this.colour = "red";
  }
};

sprites.IED.matcher = readingmatcher;
sprites.IED.summary = readingsummary;

sprites.IED.prototype.renderSVG = function() {

  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');

  // settings that are unlikely to change
  this.rect.setAttribute("fill",this.colour);
  this.rect.setAttribute("fill-opacity","0.75");
  this.rect.setAttribute("stroke","red");
  this.rect.setAttribute("stroke-width","2");


  document.getElementById("ied").appendChild(this.rect);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.rect.appendChild(this.title);
  var t = this.reading.time.indexOf("T");
  this.title.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));

  // update
  this.updateSVG(this.reading);

};

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.IED.prototype.updateSVG = function(reading) {
  this.reading = reading;
  // draw shape
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.rect.setAttribute('id',this.id);
  var x = Math.floor(xy[0]-4.0);
  var y = Math.floor(xy[1]-4.0);

  this.rect.setAttribute('x',x );
  this.rect.setAttribute('y',y );

  // rotate 45 degrees (pi/4)
  this.rect.setAttribute("transform","rotate(-45 " + (x+4) + " " + (y+4) + ")");

  this.rect.setAttribute('width',8);
  this.rect.setAttribute('height',8);
};





/** INTEL **/


sprites.Intel = function(id,reading) {
  this.reading = reading;
  this.id = id;
};

sprites.Intel.matcher = readingmatcher;
sprites.Intel.summary = readingsummary;

sprites.Intel.prototype.renderSVG = function() {

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element


  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');

  // settings that are unlikely to change
  this.rect.setAttribute("fill","gold");
  this.rect.setAttribute("fill-opacity","0.75");
  this.rect.setAttribute("stroke","purple");
  this.rect.setAttribute("stroke-width","2");


  document.getElementById("intel").appendChild(this.rect);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.rect.appendChild(this.title);
  var t = this.reading.time.indexOf("T");
  this.title.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));

  // update
  this.updateSVG(this.reading);

};

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.Intel.prototype.updateSVG = function(reading) {
  this.reading = reading;
  // draw shape
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.rect.setAttribute('id',this.id);
  var x = Math.floor(xy[0]-4.0);
  var y = Math.floor(xy[1]-4.0);

  this.rect.setAttribute('x',x );
  this.rect.setAttribute('y',y );

  this.rect.setAttribute('width',8);
  this.rect.setAttribute('height',8);
};

sprites.Intel.prototype.remove = function() {
  document.getElementById("intel").removeChild(this.rect);
};




/** VEHICLES - TODO**/



/** Target ID **/


sprites.Target = function(id,reading) {
  this.reading = reading;
  this.id = id;

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element

  this.colour = "red"; // middle red
  if ("friendly" == this.reading.layer) {
    this.colour = "blue"; // middle green
  }
};

sprites.Target.matcher = readingmatcher;
sprites.Target.summary = readingsummary;

sprites.Target.prototype.renderSVG = function() {

  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');

  // settings that are unlikely to change
  //this.rect.setAttribute("fill","none");
  this.rect.setAttribute("stroke",this.colour);
  this.rect.setAttribute("stroke-width",3);
  this.rect.setAttribute("fill-opacity","0.0");

  document.getElementById("target").appendChild(this.rect);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.rect.appendChild(this.title);
  var t = this.reading.time.indexOf("T");
  this.title.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));


  // update
  this.updateSVG(this.reading);

}

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.Target.prototype.updateSVG = function(reading) {
  this.reading = reading;
  // draw circle
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.rect.setAttribute('id',this.id);
  var size = scalelat * this.reading.size / 60.0;
  var x = Math.floor(xy[0] - (0.5*size));
  var y = Math.floor(xy[1] - (0.5*size));
  this.rect.setAttribute('x',x);
  this.rect.setAttribute('y',y);
  this.rect.setAttribute('width',size);
  this.rect.setAttribute('height',size);
};








/** Gunfire **/


sprites.Gunfire = function(id,reading) {
  this.reading = reading;

  this.time = reading.time; // TODO convert to javascript time object

  this.id = id;

  // TODO set up sprite
  // TODO check if element with id already exists, and update that element

  this.colour = "gold"; // middle red
  //if ("friendly" == this.reading.layer) {
  //  this.colour = "blue"; // middle green
  //}
};

sprites.Gunfire.matcher = readingmatcher;
sprites.Gunfire.summary = readingsummary;

sprites.Gunfire.prototype.renderSVG = function() {

  //svg.circle(xy[0],xy[1],5).attr({fill: colour, id: alert.docuri});
  this.rect = document.createElementNS('http://www.w3.org/2000/svg','rect');

  // settings that are unlikely to change
  this.rect.setAttribute("fill","red");
  this.rect.setAttribute("stroke",this.colour);
  this.rect.setAttribute("stroke-width",3);
  this.rect.setAttribute("fill-opacity","0.75");

  document.getElementById("gunfire").appendChild(this.rect);


  this.text = document.createElementNS('http://www.w3.org/2000/svg','text');
  this.text.setAttribute('id',this.id + "__text");
  this.text.setAttribute("font-size","10px");
  this.text.setAttribute("font-family","SVGFreeSansASCII,sans-serif");
  this.text.setAttribute("fill","red");
  this.text.textContent = "X";
  document.getElementById("gunfire").appendChild(this.text);

  this.title = document.createElementNS('http://www.w3.org/2000/svg','title');
  this.rect.appendChild(this.title);
  var t = this.reading.time.indexOf("T");
  this.title.textContent = this.reading.id + " @ " + (this.reading.time.substring(t + 1, t + 6));


  // update
  this.updateSVG(this.reading);

};

/**
 * Update sprite. Will also cancel its 'stale' state
 */
sprites.Gunfire.prototype.updateSVG = function(reading) {
  this.reading = reading;
  // draw circle
  var centre = this.reading.location.point;
  var latlon = centre.split(" ");
  var xy = lltoxy(latlon[0],latlon[1]);
  this.rect.setAttribute('id',this.id);
  var size = scalelat * this.reading.size / 60.0;
  var x = Math.floor(xy[0] - (0.5*size));
  var y = Math.floor(xy[1] - (0.5*size));
  this.rect.setAttribute('x',x);
  this.rect.setAttribute('y',y);
  this.rect.setAttribute('width',size);
  this.rect.setAttribute('height',size);


  this.text.setAttribute('x',x+3);
  this.text.setAttribute('y',y+4+(size/2.0));
};








com.marklogic.widgets.alertsext = window.com.marklogic.widgets.alertsext | {};
com.marklogic.widgets.alertsext.mljsdefaults = {};
for (var named in sprites) {
  com.marklogic.widgets.alertsext.mljsdefaults.named = sprites[named];
}

}).call();
