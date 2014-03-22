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



/**
 * Creates a search metrics display widget. Shows nothing if search metrics not enabled in your search options.
 * 
 * @param {string} container - The HTML element ID of the container to render this widget within.
 */
com.marklogic.widgets.trainingmetrics = function(container) {
  // TODO
};

/**
 * Called by a Search Context instance to render search metrics based on the last search operation.
 * 
 * @param {json} results - The MarkLogic REST API JSON results wrapper object
 */
com.marklogic.widgets.trainingmetrics.prototype.updateResults = function(results) {
  // TODO
};

