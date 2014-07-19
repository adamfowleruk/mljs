window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");

  var errors = new com.marklogic.widgets.error("errors");
  errors.showFirstCodefile = true;
  errors.allowDetails = true;

  try {
    // Load workplace nav bar
    var wpcontext = new com.marklogic.widgets.workplacecontext();
    var nav = new com.marklogic.widgets.workplacenavbar("navholder");
    wpcontext.register(nav);

    // Load the app wide configuration page
    var pages = new com.marklogic.widgets.workplacepagelist("pages");
    wpcontext.register(pages);

    wpcontext.loadMyPages();

  } catch (err) {
    errors.show(err);
  }

};
