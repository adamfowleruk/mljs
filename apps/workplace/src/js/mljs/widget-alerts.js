/*
Copyright 2012 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.alertsext = window.com.marklogic.widgets.alertsext || {};

com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};

// now add your own
com.marklogic.widgets.workplaceadminext.widgets.alertpanel = [
  {title: "Alert Panel", classname: "com.marklogic.widgets.alertpanel", description: "View text summaries of alerts as they arrive."}
];


/**
 * Provides textual and link visualisation to incoming alerts.
 * Supported alert packages: Document Envelope
 * Supported alerts: Matching Document (click to view - URI or doccontext), Target identified (click to zoom - geocontext)
 */
com.marklogic.widgets.alertpanel = function(container) {
  this.container = container;
  this._config = {};

  this._alertContext = null;

  this._processors = [];

  for (var module in com.marklogic.widgets.alertsext) {
    for (var ren in com.marklogic.widgets.alertsext[module]) {
      renderer = com.marklogic.widgets.alertsext[module][ren]; // TODO save name somewhere for debugging
      this._processors.push(renderer);
    }
  }

  this._init();
};


/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.alertpanel.getConfigurationDefinition = function() {
  return {
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.alertpanel.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
  //this._refresh();
};

/**
 * Sets the alert context to use
 * @param {alertcontext} ctx - Alert Context to use
 */
com.marklogic.widgets.alertpanel.prototype.setAlertContext = function(ctx) {
  this._alertContext = ctx;
};

com.marklogic.widgets.alertpanel.prototype._init = function() {
  var s = "<div class='mljswidget panel panel-info alertpanel' id='" + this.container + "-outer'>";
  s += "<div class='panel-body alertpanel-body' id='" + this.container + "-inner'>";
  s += "<div>Awaiting first alert</div>";
  s += "</div></div>";
  document.getElementById(this.container).innerHTML = s;
};

/**
 * Invoked by the alert context to respond to a new alert arriving.
 * @param {AlertJson} alertJson - The alert JSON structure to use.
 */
com.marklogic.widgets.alertpanel.prototype.updateAlert = function(alertJson) {
  // json.as = "result" - old async search processing - now unsupported
  // json.alert.reading.type = maptile | personnnel | radar | target | gunfire | document
  // json.alert.reading.id = id of alert
  // json.alert.docuri = uri
  // json.alert.reading = {}
  // json.alert.reading.location.box = "topleftx toplefty ? ? bottomrightx bottomrighty"
  // json.alert.reading.location.point = "x y"
  // json.alert.reading.layer = friendly | enemy
  var found = false;
  for (var r = 0, maxr = this._processors.length, ren;!found && r < maxr;r++) {
    ren = this._processors[r];
    if (true == (found = ren.matcher(alertJson))) {
      // render alert
      // create div
      // prepend to alertpanel data
      this._drawMessage(ren.summary(alertJson));
    }
  }
};

com.marklogic.widgets.alertpanel.prototype.updateAlertState = function(newState) {
  this._drawMessage(newState);
};

com.marklogic.widgets.alertpanel.prototype._drawMessage = function(str) {
      var div = document.createElement("div");
      div.innerHTML = str;
      var parent = document.getElementById(this.container + "-inner");
      parent.insertBefore(div,parent.childNodes[0]);

};












/**
 * A small notification bar to show when new alerts have arrived, and how many since last notifier click.
 * Typically used to show/hide an alertpanel immediately above it.
 */
com.marklogic.widgets.alertnotifier = function(container) {

};
















/**
 * A small bootstrap compatible button for showing alerts
 */
com.marklogic.widgets.alertbutton = function(container) {
  this.container = container;
  this._refresh();
};

com.marklogic.widgets.alertbutton.prototype._refresh = function() {
  var str = "<button class='btn btn-default'><span class='glyphicon glyphicon-bell'></span></button>";
  document.getElementById(this.container).innerHTML = str;
};
