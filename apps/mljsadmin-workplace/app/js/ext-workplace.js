
// Ensure extension point exists
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};


com.marklogic.widgets.searchresultsext = window.com.marklogic.widgets.searchresultsext || {};



/*
 * NEW EXAMPLE! - Using EXTENDED search result renderer support
 *
 * Based on following search options:
 *
  <search:extract-metadata>
    <search:constraint-value ref="contractor"/>
    .. other extracts here too
  </search:extract-metadata>
  ...

  <search:constraint name="contractor">
    <search:range type="xs:string" collation="http://marklogic.com/collation/">
      <search:element name="contractor" ns=""/>
    </search:range>
  </search:constraint>
  ...
  other constraints are similar for contract title, contractor, currency, and value
 *
 * For following document content:-
<Contract id="1234">
	<Contractor>Leggit and Scarper</Contractor>
	<ContractValue>3450.26</ContractValue>
	<ContractCurrencyID>GBP</ContractCurrencyID>
	<VatIncluded>Yes</VatIncluded>
	<ContractStart>08/03/2014T09:00:00</ContractStart>
	<ContractEnd>11/03/2014T18:00:00</ContractEnd>
	<OutOfHoursRequired>Yes</OutOfHoursRequired>
	<ParkingSuspensionRequired>Yes</ParkingSuspensionRequired>
	<ContractDescription>
		Paving of public footpath along SouthView Rise, 500 metre stretch, using chip and seal.
	</ContractDescription>
</Contract>
 *
 */
/* // commented out to not impact default Workplace application speed on load
com.marklogic.widgets.searchresultsext.mypackage = {
  customrenderers: {
    "contract": {
      matcher: function(result,manager,settings) { // REQUIRED
        return (null != manager.getResultExtract(result,"contractid"));
      },
      title: function(result,manager,settings) { // optional, no need to include
        // Example of an optional field
        var mytitle = manager.getResultExtract(result,"contracttitle");
        if (null == mytitle) {
          // default to default XML title (looks for xhtml title, h1, falls back to URI)
          return com.marklogic.widgets.defaulthtmlrenderer.genericXMLTitle(result,manager,settings);
        } else {
          return com.marklogic.widgets.defaulthtmlrenderer.wrapTitle(
                    result.index + ". " + mytitle, // Note you are responsible for the result.index too!
                  result,manager,settings);
        }
      },
      summary: function(result,manager,settings) { // optional, but usually the one you want to customise
        var currency = manager.getResultExtract(result,"contractcurrency");
        var amount = manager.getResultExtract(result,"contractvalue");
        var contractor = manager.getResultExtract(result,"contractor");
        var desc = manager.getResultExtract(result,"contractdesc");
        return "<div>Contract with " + contractor + " with value " + currency + " " + amount + "</div>" +
          "<div>" + desc + "</div>"; // using divs incase description has html <p> tags
      }
      // also thumbnail, actions (actions area, not individual actions), related(semantics), similar, metadata, facts(semantics) - each has an OOTB implementation
    } // end contract renderer - can add another renderer here
  } // end of customrenderers extension, also supports "customactions" too!
  ,
  customactions: {
    openoriginal: { // this is actually an OOTB action - included her for reference
      matcher: function(result,manager,settings) {
        var meta = manager.getResultExtract(result,"originalurl") ; // see if we're an XHTML ISYS filter generated file, with custom originalurl (actually something my trigger does, not ISYS itself)
        return (null != meta);
      }, render: function(result,manager,settings) {
        var meta = manager.getResultExtract(result,"originalurl") ;
        var viewOrig = "<button type=\"button\" target=\"_blank\" onclick='window.location=\"/v1/documents?uri=" + encodeURI(meta) + "\";' class=\"btn btn-default \"><span class=''>View Original</span></button>";
        return com.marklogic.widgets.defaulthtmlrenderer.wrapAction(null,viewOrig,result,manager,settings);
      }
    } // end openoriginal
  } // end custom actions
};
*/





/*
 * OLD EXAMPLE BELOW - uses processor() function - this is responsible for drawing ALL the title, summary, thumbnail, actions etc etc areas. DO NOT USE!
 */

com.marklogic.widgets.searchresultsext.tweets = {
  customrenderers: {
    "intercept-tweet": { // a MarkLogic feedsxquery captured tweet
      /* This determines whether this renderer can renderer a particular document */
      matcher: function(result,manager,settings) { // REQUIRED
        return (null != manager.getResultExtract(result,"sender"));
      },
      /* This is the old, catch all way of rendering the document - title, summary, everything. */
      processor: function (result,manager,settings) { // REQUIRED (in old version, optional in new)
        console.log("CUSTOMRENDERER: TWEET: " + result.uri);
        var id = manager.generateLazyID();
        var eid = manager.generateLazyID();
        // TODO rewrite the below for bootstrap CSS
        var s =
          "<div style='position:relative;margin-bottom: 4px;'><a class='handle' id='" + id + "'>" +
           manager.getResultExtract(result,"sender") + "</a> " +
          " " /*+ getmeta(result,"{http://www.marklogic.com/intel/intercept}extract") */+
          "</div>";
        return s;
      }
    } // end tweet custom renderer
  } // end custom renderers
};
