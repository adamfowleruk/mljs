
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  
  // save then get doc
  var docs = [
    {title: "The Goonies",actor: "Sean Astin", genre: "Comedy", year: "1985"},
    {title: "50 First Dates",actor: "Sean Astin", genre: "Comedy", year: "2004"},
    {title: "Kingdom Hearts",actor: "Sean Astin", genre: "Comedy", year: "2002"},
    {title: "The Sky Is Falling",actor: "Sean Astin", genre: "Comedy", year: "2001"},
    {title: "Dorothy and the Witches of Oz",actor: "Sean Astin", genre: "Fantasy", year: "2012"},
    {title: "The Lord of the Rings: The Return of the King",actor: "Sean Astin", genre: "Fantasy", year: "2003"},
    {title: "The Lord of the Rings: The Two Towers",actor: "Sean Astin", genre: "Fantasy", year: "2002"},
    {title: "The Lord of the Rings: The Fellowship of the Ring",actor: "Sean Astin", genre: "Fantasy", year: "2001"},
    {title: "Teenage Mutant Ninja Turtles",actor: "Sean Astin", genre: "Adventure", year: "2013"},
    {title: "Dumb and Dumber To",actor: "Jim Carrey", genre: "Comedy", year: "2014"},
    {title: "Kick-Ass 2",actor: "Jim Carrey", genre: "Comedy", year: "2013"},
    {title: "Mr. Popper's Penguins",actor: "Jim Carrey", genre: "Comedy", year: "2011"},
    {title: "I Love You Philip Morris",actor: "Jim Carrey", genre: "Comedy", year: "2009"},
    {title: "Ace Ventura: When Nature Calls",actor: "Jim Carrey", genre: "Comedy", year: "1995"},
    {title: "Ace Ventura: Pet Detective",actor: "Jim Carrey", genre: "Comedy", year: "1994"},
    {title: "A Christmas Carol",actor: "Jim Carrey", genre: "Drama", year: "2009"},
    {title: "The Number 23",actor: "Jim Carrey", genre: "Drama", year: "2007"}
  ];
  
  for (var i = 0;i < docs.length;i++) {
    db.save(docs[i],"/movies/" + i,{collection: "movies"}, function(result) {
      // do something
    });
  }
});