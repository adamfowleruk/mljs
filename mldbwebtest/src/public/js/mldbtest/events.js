/**
 * Provides objects for generic event publish-subscribe workflows
 */

com = window.com || {};
com.marklogic = window.com.marklogic || {};

com.marklogic.events = {};

// EVENT

com.marklogic.events.Event = function(type,data) {
  this.type = type;
  this.data = data;
};

// PUBLISHER

com.marklogic.events.Publisher = function() {
  this.listeners = new Array();
};

com.marklogic.events.Publisher.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
};

com.marklogic.events.Publisher.prototype.unsubscribe = function(listener) {
  var newArr = new Array();
  for (var i = 0;i < this.listeners.length;i++) {
    if (listener != this.listeners[i]) {
      newArr.push(this.listeners[i]);
    }
  }
  this.listeners = newArr;
};


com.marklogic.events.Publisher.prototype.publish = function(event) {
  for (var i = 0;i < this.listeners.length;i++) {
    this.listeners[i](event);
  }
};