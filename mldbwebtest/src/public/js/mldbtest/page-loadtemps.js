
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  
  // save then get doc
  var docs = [
    {city: "London", month: "Jan", reading: { temp: 0}},
    {city: "London", month: "Jan", reading: { temp: 2}},
    {city: "London", month: "Jan", reading: { temp: 3}},
    {city: "London", month: "Jan", reading: { temp: -1}},
    {city: "London", month: "Jan", reading: { temp: -1}},
    {city: "London", month: "Feb", reading: { temp: 4}},
    {city: "London", month: "Feb", reading: { temp: 8}},
    {city: "London", month: "Mar", reading: { temp: 10}},
    {city: "London", month: "Mar", reading: { temp: 12}},
    {city: "London", month: "Apr", reading: { temp: 17}},
    {city: "London", month: "May", reading: { temp: 22}},
    {city: "London", month: "Jun", reading: { temp: 24}},
    {city: "London", month: "Jul", reading: { temp: 23}},
    {city: "London", month: "Aug", reading: { temp: 19}},
    {city: "London", month: "Sep", reading: { temp: 17.5}},
    {city: "London", month: "Oct", reading: { temp: 12}},
    {city: "London", month: "Nov", reading: { temp: 8}},
    {city: "London", month: "Dec", reading: { temp: 4}},
    {city: "Derby", month: "Jan", reading: { temp: -2}},
    {city: "Derby", month: "Jan", reading: { temp: -2}},
    {city: "Derby", month: "Feb", reading: { temp: 2}},
    {city: "Derby", month: "Feb", reading: { temp: 2}},
    {city: "Derby", month: "Mar", reading: { temp: 4}},
    {city: "Derby", month: "Mar", reading: { temp: 4}},
    {city: "Derby", month: "Apr", reading: { temp: 5}},
    {city: "Derby", month: "May", reading: { temp: 5.5}},
    {city: "Derby", month: "Jun", reading: { temp: 9}},
    {city: "Derby", month: "Jul", reading: { temp: 18}},
    {city: "Derby", month: "Aug", reading: { temp: 21}},
    {city: "Derby", month: "Sep", reading: { temp: 17}},
    {city: "Derby", month: "Oct", reading: { temp: 7}},
    {city: "Derby", month: "Nov", reading: { temp: 2.5}},
    {city: "Derby", month: "Dec", reading: { temp: -1}}
  ];
  
  for (var i = 0;i < docs.length;i++) {
    db.save(docs[i],"/temp/" + i,{collection: "temperatures"}, function(result) {
      // do something
    });
  }
});