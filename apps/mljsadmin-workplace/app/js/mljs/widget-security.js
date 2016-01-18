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







com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};
com.marklogic.widgets.workplaceadminext.widgets["widget-security.js"] = [
  {title: "Login/out", classname: "com.marklogic.widgets.loginout", description: "Login and out box."}
];



com.marklogic.widgets.loginout = function(container) {
  this.container = container;

  this._sessionContext = mljs.prototype.sessioncontext.instance;

  this._init();
};

com.marklogic.widgets.loginout.getConfigurationDefinition = function() {
  return {};
};

com.marklogic.widgets.loginout.prototype.setConfiguration = function(config) {

};

com.marklogic.widgets.loginout.prototype.setSessionContext = function(sc) {
  this._sessionContext = sc;
};


com.marklogic.widgets.loginout.prototype.updateSession = function(session) {
  if (true === session.authenticated) {
    com.marklogic.widgets.hide(document.getElementById(this.container + "-loginpanel"),true);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-notifications"),true);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-logoutpanel"),false);
    // show logged in as username
    document.getElementById(this.container + "-loggedinas").innerHTML = session.user;
  } else {
    com.marklogic.widgets.hide(document.getElementById(this.container + "-loginpanel"),false);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-logoutpanel"),true);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-notifications"),false);
    document.getElementById(this.container + "-notifications").innerHTML = "Login failed"; // TODO get server message
  }
};

com.marklogic.widgets.loginout.prototype._init = function() {
  var self = this;
  var s = "<div class='mljswidget loginout'>";
  s +=    " <div class='panel panel-info' id='" + this.container + "-loginpanel'>";
  s +=    "  <div class='title panel-heading'>Login</div>";
  s +=    "  <div class='panel-body'>";
  s +=    "   <div class='bg-danger hidden' id='" + this.container + "-notifications'></div>";
  s +=    "   <label for='" + this.container + "-user'>Username: </label>";
  s +=    "   <input type='text' class='' value='' id='" + this.container + "-user' placeholder='Enter username' />";
  s +=    "   <br/>";
  s +=    "   <label for='" + this.container + "-password'>Password: </label>";
  s +=    "   <input type='password' class='' value='' id='" + this.container + "-password' placeholder='Enter password' />";
  s +=    "   <br/>";
  s +=    "   <button class='btn btn-primary' id='" + this.container + "-login'>Login</button>";
  s +=    "  </div>";
  s +=    " </div>";
  s +=    " <div class='panel panel-info hidden' id='" + this.container + "-logoutpanel'>";
  s +=    "  <div>You are logged in as: <span id='" + this.container + "-loggedinas'></span></div>";
  s +=    "  <br/>";
  s +=    "  <button class='btn btn-primary' id='" + this.container + "-logout'>Logout</button>";
  s +=    " </div>";
  s +=    "</div>";
  document.getElementById(this.container).innerHTML = s;

  document.getElementById(this.container + "-login").onclick = function(evt) {
    if (null != self._sessionContext) {
      self._sessionContext.login(document.getElementById(self.container + "-user").value,document.getElementById(self.container + "-password").value);
    }
    evt.stopPropagation();
    return false;
  };
};
