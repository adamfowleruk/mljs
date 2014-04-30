window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");

  var errors = new com.marklogic.widgets.error("errors");
  errors.showFirstCodefile = true;
  errors.allowDetails = true;

  try {
    // Load workplace nav bar only
    var wpcontext = new com.marklogic.widgets.workplacecontext();
    var nav = new com.marklogic.widgets.workplacenavbar("navholder");
    wpcontext.register(nav);
    wpcontext.loadMyPages();

  } catch (err) {
    errors.show(err);
  }

};
