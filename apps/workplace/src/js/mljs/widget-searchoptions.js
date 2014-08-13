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
 * Creates a widget that wraps a search context's options configuration.
 * @constructor
 */
com.marklogic.widgets.searchoptions = function(container) {
  this.container = container;

  this._config = {
    // TODO mode for customisation vs. configuration?
    // TODO version allowable options?
  };
/*
  var range = {
          childDefinitions: {
            annotation: {},
            "computed-bucket": {
              childDefinitions: {
                name: {},
                lt: {},
                ge: {},
                anchor: {},
                label: {}
              }
            },
            type: {},
            "path-index": {
              childDefinitions: {
                text: {},
                namespaces: {}
              }
            },
            collation: {},
            facet: {},
            "facet-option": {},
            element: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            attribute: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            "fragment-scope": {}
          }
        };

  // options config is the Workplace configuration definition for the search options themselves, NOT this widget
  this._optionsConfig = {
    "concurrency-level": {},
    debug: {},
    "extract-metadata": {
      childDefinitions: {
        "json-key": {},
        "constraint-value": {
          childDefinitions: {
            "ref": {}
          }
        },
        "qname": {
          childDefinitions: {
            "elem-ns": {},
            "elem-name": {},
            "attr-ns": {},
            "attr-name": {}
          }
        }
      }
    },
    forest: {},
    "fragment-scope": {},
    "searchable-expression": {
      childDefinitions: {
        text: {},
        namespaces: {}
      }
    },
    term: {},
    tuples: {
      childDefinitions: {
        name: {},
        range: range,
        "values-option": {
          childDefinition: {}
        }
      }},
    values: {
      childDefinitions: {
        name: {},
        range: range,
        "values-option": {
          childDefinition: {}
        }
      }
    },
    "page-length": {}.
    "transform-results": {
      childDefinitions: {
        apply: {},
        ns: {},
        at: {}
      }
    },

    constraint: {
      childDefinitions: {
        name: {},
        annotation: {},
        collection: {
          childDefinitions: {
            prefix: {},
            "facet-option": {}
          }
        },
        element: {
          childDefinitions: {
            name: {},
            ns: {}
          }
        },
        "geo-elem": {
          childDefinitions: {
            parent: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            element: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            }
          }
        },
        "geo-elem-pair": {
          childDefinitions: {
            parent: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            lat: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            lon: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            heatmap: {},
            "geo-option": {

            }
          }
        },
        "geo-path": {
          childDefinitions: {
            "path-index": {
              childDefinitions: {
                "text": {},
                namesapces: {}
              }
            }
          }
        }
        range: range,
        value: {
          childDefinitions: {
            "element": {
              childDefinitions: {
                name: {},
                ns: {}
              }
            },
            "fragment-scope": {}
          }
        },
        field: {
          childDefinitions: {
            name: {}
          }
        },
        container: {
          childDefinitions: {
            "json-key": {},
            element: {
              childDefinitions: {
                name: {},
                ns: {}
              }
            }
          }
        },
        properties: {},
        custom: {
          childDefinitions: {
            parse: {
              childDefinitions: {
                apply: {},
                ns: {},
                at: {}
              }
            },
            start: {
              childDefinitions: {
                apply: {},
                ns: {},
                at: {}
              }
            },
            finish: {
              childDefinitions: {
                apply: {},
                ns: {},
                at: {}
              }
            } // end finish
          } // end child defs
        } // end custom
      }
    },
    "default-suggestion-source": {},
    "additional-query": {},
    grammar: {
      childDefinitions: {
        start: {
          childDefinitions: {
            label: {},
            apply: {},
            strength: {},
            element: {},
            delimiter: {}
          }
        }, // TODO or starter?
        joiner: {
          childDefinitions: {
            label: {},
            apply: {},
            strength: {}
          }
        },
        quotation: {},
        implicit: {},

      }
    },
    operator: {},
    "quality-weight": {},
    "return-metrics": {},
    "return-results": {},
    "return-qtext": {},
    "return-query": {},
    "return-similar": {},
    "return-aggregates": {},
    "return-constraints": {},
    "return-facets": {},
    "return-frequencies": {},
    "return-plan": {},
    "search-option": {

    },
    "sort-order": {
      childDefinitions: {
        direction: {},
        score: {},
        annotation: {},
        "json-key": {},
        element: {
          childDefinitions: {
            name: {},
            ns: {}
          }
        },
        attribute: {
          childDefinitions: {
            name: {},
            ns: {}
          }
        },
        field: {
          childDefinitions: {
            name: {},
            collation: {}
          }
        }
      }
    },
    "suggestion-source": {
      childDefinitions: {
        ref: {},
        "suggestion-option": {}
      }
    }

  };*/

  this._searchContext = mljs.defaultConnection.createSearchContext();
  this._options = {};
};

com.marklogic.widgets.searchoptions.prototype.setSearchContext = function(ctx) {
  this._searchContext = ctx;
  this._options = this._searchContext.getOptions();

  this._refresh();
};

com.marklogic.widgets.searchoptions.prototype.wrap = function(optionsJson) {
  this._options = optionsJson;
  this._refresh();
};



com.marklogic.widgets.searchoptions.prototype._refresh = function() {
  // draw the options
};
