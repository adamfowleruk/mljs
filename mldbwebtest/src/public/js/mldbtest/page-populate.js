
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  
  // save then get doc
  var docs = [
    {title: "Polly the Penguin", summary: "Penguins are awesome", animal: "penguin", family: "bird", age: 15},
    {title: "Olly the Ostrich", summary: "Tasty and lean", animal: "ostrich", family: "bird", age: 12},
    {title: "Dave the MarkLogician", summary: "Sir Dave of Vanguard", animal: "homosapien", family: "marklogician",age: 21},
    {title: "Eric the MarkLogician", summary: "Sir Eric of the Community", animal: "homosapien", family: "marklogician", age: 21},
    {title: "Dilbert the Dog", summary: "Dogs are cool", animal: "dog", family: "pet", age: 7},
    {title: "Dogbert the Dog", summary: "I feel woof", animal: "dog", family: "pet", age: 3},
    {title: "Dizzie the Dog", summary: "Which way d'he go?", animal: "dog", family: "pet", age: 9},
    {title: "Charlie the Cat", summary: "Cats are boring", animal: "cat", family: "pet", age: 6},
    {title: "Hammy the Hamster", summary: "Do dah dee dee do dah do do", animal: "hamster", family: "pet", age: 3},
    {title: "Hetty the Hamster", summary: "He he he he he", animal: "hamster", family: "pet", age: 4},
    {title: "George the Gerbil", summary: "Tiny", animal: "gerbil", family: "pet", age:1},
    {title: "Charlie the Cat", summary: "Only live a couple of years", animal: "guinea pig", family: "pet", age: 5},
    {title: "Adam the MarkLogician", summary: "Adam has no imagination", animal: "homosapien", family: "marklogician", age: 21}
  ];
  
  for (var i = 0;i < docs.length;i++) {
    db.save(docs[i],"/animals/" + i,{collection: "animals"}, function(result) {
      // do something
    });
  }
});