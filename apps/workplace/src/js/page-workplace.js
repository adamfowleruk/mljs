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
    wpcontext.loadMyPages();

    // TODO Load the current page configuration

  } catch (err) {
    errors.show(err);
  }

};
