
  
  this.defaultProcessor = {
    matcher: function(result) {
      return true; // handles all results
    }, 
    processor: function(result) {
      // check if 1 root json element that is called 'html'
      /*
      console.log("TYPEOF: " + (typeof result.content));
      console.log("length: " + ( result.content.length));
      console.log("html: " + ( result.content.html)); */
      self.ctx.db.logger.debug("matches: " + result.matches);
      if (undefined != result.matches) {
        self.ctx.db.logger.debug("first match: " + result.matches[0]);
        self.ctx.db.logger.debug("match text: " + result.matches[0]["match-text"]);
        self.ctx.db.logger.debug("match text 0: " + result.matches[0]["match-text"][0]);
      }
      if ("string" == typeof result.content && result.content.substring(0,1) == "{") {
        self.ctx.db.logger.debug("Found JSON string object");
        var json = JSON.parse(result.content);
        self.ctx.db.logger.debug("defaultProcessor:  - JSON parse successful...");
        
        // we hit this line if we succeed
        return com.marklogic.widgets.searchhelper.handleJson(result,json);
      } else if ("string" == typeof result.content && -1 != result.content.substring(0,100).indexOf("<html")) { // TODO replace with XPath as this is very wide ranging - http://www.w3.org/1999/xhtml (escape dots?)
          // Get title from /html/head/title or /html/body/h1[1] or /html/body/h2[1] or /html/body/p[1]
          // don't rely on xml.evaluate() though
          self.ctx.db.logger.debug("searchresults: defaultProcesor: Got HTML content");
          var titleStart = result.content.indexOf("title>"); // NB can't do <title because there may be a random namespace name. Replace this with XPATH if supported
          var titleEnd = result.content.indexOf("title>",titleStart + 6);
          var bodyStart = result.content.indexOf("body");
          var bodyEnd = result.content.indexOf(">",bodyStart + 4);
          var endBodyStart = result.content.indexOf("body",bodyEnd + 1);
          self.ctx.db.logger.debug("titleStart: " + titleStart);
          self.ctx.db.logger.debug("titleEnd: " + titleEnd);
          self.ctx.db.logger.debug("bodyStart: " + bodyStart);
          self.ctx.db.logger.debug("bodyEnd: " + bodyEnd);
          self.ctx.db.logger.debug("endBodyStart: " + endBodyStart);
          
          //var endBodyEnd = result.content.indexOf(">",endBodyStart + 6);
          
          var bodyContent = result.content.substring(bodyEnd + 1,endBodyStart);
          self.ctx.db.logger.debug("bodyContent: " + bodyContent);
          var title = result.uri;
          if (-1 != titleStart && -1 != titleEnd) {
            title = result.content.substring(titleStart + 6,titleEnd);
          } else {
            var firstElStart = bodyContent.indexOf("<");
            var firstElEnd = bodyContent.indexOf(">",firstElStart + 1);
            var endFirstElStart = bodyContent.indexOf("</",firstElEnd);
            if (-1 != firstElStart && -1 != firstElEnd && -1 != endFirstElStart) {
              title = bodyContent.substring(firstElEnd + 1,endFirstElStart);
            } 
          }
          self.ctx.db.logger.debug("title: " + title);
          // render first 4 elements from /html/body/element()[1 to 4]
          // render all content for now
          
          var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
          resStr += "<div class='searchresults-snippet'>" + bodyContent + "</div>";
          resStr += "</div>";
          return resStr;
          
        //} else {
          
          /*
          self.ctx.db.logger.debug("defaultProcessor: Got JSON Object rendering of an HTML document");
          // is a xhtml document rendered as json
          var content = result.content.html.body;
          var resStr = htmlRec(content);
          */
        } 
       else if (undefined != result.matches && undefined != result.matches[0] && undefined != result.matches[0]["match-text"] && undefined != result.matches[0]["match-text"][0] /*&& result.matches[0]["match-text"][0].indexOf("<html") == 0*/) {
        self.ctx.db.logger.debug("defaultProcessor: Got a snippet match with a html element");
        
        //var xml = textToXML(result.matches[0]["match-text"][0]);
        //var txt = result.matches[0]["match-text"][0];
        //self.ctx.db.logger.debug("RAW HTML TEXT: " + txt);
        //var strip = txt.substring(txt.indexOf(">",txt.indexOf("<body") + 5) + 1,txt.indexOf("</body>"));
        //self.ctx.db.logger.debug("STRIP TEXT: " + strip);
        var title = null;
        //var titleEl = xml.getElementsByTagName("title")[0];
        self.ctx.db.logger.debug("PATH: " + result.path);
        //if (undefined != titleEl && null != titleEl && null != titleEl.nodeValue) {
        //  title = titleEl.nodeValue;
        //} else {
          title = result.path.substring(8,result.path.length - 2);
        //}
        var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
        //resStr += "<div class='searchresults-snippet'>" + (new XMLSerializer()).serializeToString(xml.getElementsByTagName("body")[0]) + "</div>";
        
        
        resStr += com.marklogic.widgets.searchhelper.snippet(result);
        
        //resStr += "<div class='searchresults-snippet'>" + /*strip*/ txt + "</div>";
        //resStr += "<div class='searchresults-snippet'><iframe scrolling='no'>" + result.matches[0]["match-text"][0] + "</iframe></div>";
        
        resStr += "</div>";
        return resStr;
      } else if ("object" == typeof(result.content)) {
        // TRY TO GUESS JSON CONTENT - V6 and older V7 builds - now (29 Oct 2013) even JSON is escaped as a string!!!
        self.ctx.db.logger.debug("defaultProcessor: Got JSON Object content");
        
        return com.marklogic.widgets.searchhelper.handleJson(result,result.content);
      } else if (result.format == "text") {
        // plain text result
        
        var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + result.uri + "</h3>";
        if (result.content.length <= 100) {
          resStr += result.content;
        } else {
          resStr += result.content.substring(0,100) + "...";
        }
        resStr += "</div>";
        return resStr;
      } else {
        // ATTEMPT TO PARSE AS XML
        self.ctx.db.logger.debug("defaultProcessor: Got escaped string - Could be XML or JSON ...");
        
        // try to parse as JSON first
        try {
          var json = JSON.parse(result.content);
          self.ctx.db.logger.debug("defaultProcessor:  - JSON parse successful...");
          
          // we hit this line if we succeed
          return com.marklogic.widgets.searchhelper.handleJson(result,json);
        } catch (err) {
          // try XML now        
          try {
            var xmlDoc = textToXML(result.content);
            self.ctx.db.logger.debug("defaultProcessor:  - XML parse successful...");
            
            var resStr = "";
            // parse each results and snippet / raw content
            var title = result.uri;
            var snippet = null;
            
            if (undefined != xmlDoc.evaluate) {
              // check for common title names - title, name, id, h1
              var evalResult = xmlDoc.evaluate("//title[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
                self.ctx.db.logger.debug("defaultProcessor: //title[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//name[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                
                if (undefined == evalResult || "" == evalResult.stringValue) {
                  self.ctx.db.logger.debug("defaultProcessor: //name[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//id[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                
                  if (undefined == evalResult || "" == evalResult.stringValue) {
                self.ctx.db.logger.debug("defaultProcessor: //id[1]/text() undefined");
                    evalResult = xmlDoc.evaluate("//h1[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                
                    if (undefined == evalResult || "" == evalResult.stringValue) {
                      self.ctx.db.logger.debug("defaultProcessor: //h1[1]/text() undefined");
                      self.ctx.db.logger.debug("defaultProcessor: trying (//text())[1]");
                      evalResult = xmlDoc.evaluate("(//text())[1]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                      self.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                    }
                  }
                }
              }
              if (undefined != evalResult && null != evalResult && "" != evalResult.stringValue) {
                title = evalResult.stringValue;
              }
              // check for common snippet names - summary, synopsis, description, details
              evalResult = xmlDoc.evaluate("//summary[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
                self.ctx.db.logger.debug("defaultProcessor: //summary[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//synopsis[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                if (undefined == evalResult || "" == evalResult.stringValue) {
                  self.ctx.db.logger.debug("defaultProcessor: //synopsis[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//description[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                  if (undefined == evalResult || "" == evalResult.stringValue) {
                    self.ctx.db.logger.debug("defaultProcessor: //description[1]/text() undefined");
                    evalResult = xmlDoc.evaluate("//details[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                    
                    if (undefined == evalResult || "" == evalResult.stringValue) {
                      self.ctx.db.logger.debug("defaultProcessor: //details[1]/text() undefined");
                      self.ctx.db.logger.debug("defaultProcessor: trying (//text())[2]");
                      evalResult = xmlDoc.evaluate("(//text())[2]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                      self.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                    }
                  }
                }
              }
              if (undefined != evalResult && null != evalResult && "" != evalResult.stringValue) {
                snippet = evalResult.stringValue;
              }
            }
          
            if (null == snippet) {
              // show XML tree structure as HTML
              self.ctx.db.logger.debug("defaultProcessor: No XML summary, building XML tree HTML output");
              
              // display tree of XML
              snippet = com.marklogic.widgets.searchhelper.xmltohtml(xmlDoc); // TODO
            }
            
            if (null == snippet) {
              snippet = result.content;
            }
          
            resStr += "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
            if (null != snippet) {
              resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
            }
            resStr += "</div>";
            return resStr;
          } catch (err) {
            self.ctx.db.logger.debug("defaultProcessor: XML mode: Failed to create XML document from text: " + result.content);
          }
          
          
          // end try XML noe
        }
      }
    }
  };
  
  this.builtinProcessors = [];
  this.builtinProcessors["svg"] = {
   matcher: function(result) {
    var xml = null;
    if ("string" == typeof result.content) {
      xml = textToXML(result.content);
    } else if ("object" == typeof result.content && undefined != result.content.nodeType) {
      xml = result.content; // should never happen - always returned as string
    }
    if (null != xml) {
      // check namespace and root element
      if (xml.childNodes[0].nodeName == "svg") {
        mljs.defaultconnection.logger.debug("Potential SVG nodeName: " + xml.childNodes[0].nodeName);
        mljs.defaultconnection.logger.debug("Potential SVG nodeType: " + xml.childNodes[0].nodeType);
        return true;
      } else {
        return false;
      }
    }
    return false;
  }, processor: function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.uri + "</h3>" +
      "<div style='height: 200px;position:relative;'>" + result.content + "</div></div>"; // returns the full xml to be applied within the document as SVG
  } };