xquery version "1.0-ml";

module namespace m = "http://marklogic.com/roxy/models/rdb2rdf";

import module namespace sem = "http://marklogic.com/semantics" at "/MarkLogic/semantics.xqy";
import module namespace sql  = "http://xqdev.com/sql" at "/app/models/sql.xqy";
       declare namespace my='http://mycompany.com/test';
declare namespace rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#";

declare function m:list-schema($samurl as xs:string) as element(m:list-schema) {
  <m:list-schema>{
    let $res := sql:execute("SELECT DISTINCT ke.TABLE_SCHEMA FROM information_schema.KEY_COLUMN_USAGE ke ORDER BY ke.TABLE_SCHEMA", $samurl, ())
    let $l := xdmp:log($res)
    return
      for $sc in $res/sql:tuple/TABLE_SCHEMA/text()
      return
        <m:schema>{$sc}</m:schema> 
  }</m:list-schema>
};

(:
Fetches database info
parameters supported:-
 - samurl - URL for the MLSAM web services endpoint
 - schema - name of the schema to fetch information for
  
Generates:-

{information: {
    table: [{
      name: "customers", 
      columns: [{column: { name: "custnum", rawtype: "int(11)", xmltype: "xs:integer", nillable: false}}, /* others */],
      metrics: {rowcount: 143}
    }, // others ...
    ],
    relationship: [ {
      table: "t", column: "t", referencedtable: "t", referencedcolumn: "t", constraint: "t", 
    }, /* others */
    ]
}
}

:)
declare function m:get-schema-info($samurl,$schema) as element(m:schema-info) {
  (: global setup :)
  let $types := m:get-types-map()
  return
  <m:schema-info>  
    {
      (: list tables in database :)
      for $tabletuple in sql:execute(fn:concat("SHOW FULL TABLES FROM ",$schema), $samurl, ())/sql:tuple[TABLE_TYPE = "BASE TABLE"] (: restricts to real tables :)
      let $tablename := $tabletuple/TABLE_NAME/text()
      
      (: for each table, fetch field information :)
      return
        <m:table><m:name>{$tablename}</m:name>
        <m:metrics><m:rowcount>{
          sql:execute(fn:concat("SELECT count(*) CNT from ",$schema,".",$tablename), $samurl, ())/sql:tuple/CNT/text()
        }</m:rowcount></m:metrics>
        
        {
          for $column in sql:execute(fn:concat("DESCRIBE ",$schema,".",$tablename),$samurl, ())/sql:tuple
          let $rawtype := $column/COLUMN_TYPE/text()
          let $basetype := fn:tokenize($rawtype,"\(")[1]
          let $xmltype := map:get($types,$basetype)
          return
            <m:column><m:name>{$column/COLUMN_NAME/text()}</m:name><m:rawtype>{$rawtype}</m:rawtype><m:xmltype>{$xmltype}</m:xmltype><m:nillable>{if ($column/IS_NULLABLE/text() = "NO") then fn:false() else fn:true()}</m:nillable></m:column>
        }</m:table>
    }
    {
      (: Fetch a list of relationships :)
      for $rel in sql:execute(fn:concat("SELECT ke.* FROM information_schema.KEY_COLUMN_USAGE ke WHERE ke.referenced_table_name IS NOT NULL and ke.TABLE_SCHEMA=""",$schema,""" ORDER BY ke.referenced_table_name"),$samurl, ())/sql:tuple
      return
        <m:relationship>
          <m:referencedtablename>{$rel/REFERENCED_TABLE_NAME/text()}</m:referencedtablename>
          <m:referencedcolumnname>{$rel/REFERENCED_COLUMN_NAME/text()}</m:referencedcolumnname>
          <m:tablename>{$rel/TABLE_NAME/text()}</m:tablename>
          <m:columnname>{$rel/COLUMN_NAME/text()}</m:columnname>
          <m:constraint>{$rel/CONSTRAINT_NAME/text()}</m:constraint>
        </m:relationship>
    }
  </m:schema-info>
};

declare function m:get-types-map() as map:map {
  
  let $types := map:map()
  let $o := map:put($types,"int","xs:integer")
  let $o := map:put($types,"varchar","xs:string")
  let $o := map:put($types,"datetime","xs:dateTime")
  let $o := map:put($types,"double","xs:double")
  return $types
};

(:



POST - Perform ingest of triples to the named graph
document config format (JSON or XML namespace same as extension lib)

{ingest: {
  database: {
    samurl: "http://kojak.marklogic.com:8080/mlsam/samurl",
    schema: "test2"
  },
  create: {
    graph: "mynamedgraph"
  },
  selection: {
    // Either: SCHEMA MODE NOT SUPPORTED - HANDLED AUTOMATICALLY WITH W3C DIRECT MAPPING IN DATA MODE
    mode: "schema", // Creates interdependencies between tables
    table: ["customers","policies","address"] // Other RD info required here
    
    // Or: 
    mode: "data",
    table: ["customers"], offset: 101, limit: 100, column: ["column1","column2"]
  },
  /* relationships are redundant - we look them up dynamically each call now 
  relationship: [ {
      tablename "t", columnname: "t", referencedtablename: "t", referencedcolumnname: "t", constraint: "t", 
    }, /* others */
  ]
  */
}
}

returns:-

{ingestresult: {
  docuri: ["/triplestore/2c78915c5854b0f8.xml", ... ],
  outcome: "success",
  statistics: {
    triplecount: 1034, rowcount: 100, entitycount: 100
  }
}
}


TODO Support multiple tables (or all when none specified)
TODO Support newer-than (high than) for primary keys to limit what gets pulled in
TODO Support ingesting all columns when none specified

:)
declare function m:rdb2rdf-direct-partial($config as element(m:ingest)) as element(m:ingestresult) {
  (: Perform W3C direct mapping with specified index settings :)
  let $types := m:get-types-map()
  let $samurl := $config/m:database/m:samurl/text()
  let $schema := $config/m:database/m:schema/text()
  let $graph := $config/m:create/m:graph/text()
  let $tablename := $config/m:selection/m:table[1]/text()
  let $statsmap := map:map() (: triplecount as xs:integer, entitycount as xs:integer, rowcount as xs:integer ... :)
  let $so := map:put($statsmap,"triplecount",0)
  let $so := map:put($statsmap,"rowcount",0)
  let $so := map:put($statsmap,"entitycount",0)
  let $so := map:put($statsmap,"anoncount",0)
  let $sqlpk := fn:concat("SELECT ke.COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE ke WHERE ke.TABLE_SCHEMA=""" , $schema , """ AND ke.referenced_table_name IS NULL AND ke.table_name=""" , $tablename , """ ")
  let $l := xdmp:log($sqlpk)
  let $set := sql:execute($sqlpk,$samurl, ())
  let $ex := ($set/sql:meta/sql:exceptions/sql:exception/sql:reason)
  let $insertresult := ()
  let $l := xdmp:log("SQL OUTPUT:-")
  let $l := xdmp:log($set)
  let $primarykeycolumns := $set/sql:tuple/COLUMN_NAME/text()
  let $o := xdmp:log(fn:concat("PRIMARY KEY COLUMNS: ", $primarykeycolumns))
  let $sqlfk := fn:concat("SELECT ke.COLUMN_NAME,ke.REFERENCED_COLUMN_NAME,ke.REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE ke WHERE ke.TABLE_SCHEMA=""" , $schema , """ AND ke.referenced_table_name IS NOT NULL AND ke.table_name=""" , $tablename , """ ")
  let $l := xdmp:log($sqlfk)
  let $set2 := sql:execute($sqlfk,$samurl, ())
  let $ex := ($ex,$set2/sql:meta/sql:exceptions/sql:exception/sql:reason)
  (:let $l := xdmp:log("SQL OUTPUT 2:-")
  let $l := xdmp:log($set2):)
  let $foreignkeycolumns := $set2/sql:tuple (: TODO restrict to only columns we have specified to import, not all fk relationships :)
  let $o := xdmp:log("FOREIGN KEY COLUMNS:- ")
  let $o := xdmp:log($foreignkeycolumns)
  let $pkcount := fn:count($primarykeycolumns)
  let $descriptions := sql:execute(fn:concat("DESCRIBE ",$schema,".",$tablename),$samurl, ())/sql:tuple
  let $l := xdmp:log("DESCRIPTIONS:-")
  let $l := xdmp:log($descriptions)
  return
    <m:ingestresult>{
      (: MODE = table :)
      (: Perform ingest of a single table. No need to process tables without foreign keys first as the W3C direct mapping is consistent without this. :)
      (: Fetch appropriate data :)
      let $colnames := 
        if (fn:empty($config/m:selection/m:column)) then
            for $column in sql:execute(fn:concat("DESCRIBE ",$schema,".",$tablename),$samurl, ())/sql:tuple
            (:let $rawtype := $column/COLUMN_TYPE/text()
            let $basetype := fn:tokenize($rawtype,"\(")[1]
            let $xmltype := map:get($types,$basetype):)
            return
              $column/COLUMN_NAME/text()
        else $config/m:selection/m:column/text()
      let $collist := fn:concat("`",fn:string-join($colnames,"`, `" ),"`")
      let $base := fn:concat("http://marklogic.com/rdb2rdf/" , $schema , "/") (: RDF base: property :)
      
      let $dostuff :=
        if(fn:empty($colnames)) then
          ()
        else
      
      let $sqldata := fn:concat("SELECT ", $collist, " FROM ",$schema,".",$tablename," ORDER BY ",$collist, " LIMIT ",$config/m:selection/m:offset/text(), ",", $config/m:selection/m:limit/text())
      let $l := xdmp:log($sqldata)
      let $sqlout := sql:execute($sqldata,$samurl, ())
      let $ex := ($ex,$sqlout/sql:meta/sql:exceptions/sql:exception/sql:reason)
      let $l := xdmp:log($sqlout)
      let $data := $sqlout/sql:tuple
      (: Generate our identity (if primary key exists) or temporary id (no primary key) :)
      let $objclass := fn:concat($base , m:rdfescape($tablename))
      let $put := map:put($statsmap,"rowcount",fn:count($data))
      let $triples :=
        for $row at $idx in $data
        let $o := xdmp:log(fn:concat("Row id: ", fn:string($idx)))
        (:let $rc := map:put($statsmap,"rowcount",map:get($statsmap,"rowcount") + 1):)
        let $subject := 
          if ($pkcount gt 0) then fn:concat(
            $objclass , "/" , fn:concat(
              (: return COLNAME=colvalue with separating semi colon if a composite primary key :)
              for $pk at $pkidx in $primarykeycolumns
                let $l := xdmp:log(fn:concat("PK value: ", $pk))
              return
                ( fn:concat((
                  if ($pkidx gt 1) then ";" else 
                  fn:concat( m:rdfescape($pk) , "=" , m:rdfescape($row/element()[fn:local-name(.) = $pk]/text())))
                ))))
            
          else (
            let $nc := map:get($statsmap,"anoncount") + 1
            let $nnc := map:put($statsmap,"anoncount",$nc)
            return fn:concat(("_:a" , xs:string($nc))) (: TODO ensure this is consistent for multiple anon subjects with same _a index in same graph, added at different times :)
          )
        return (: per row :)
        (
          (sem:triple(sem:iri($subject), sem:iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), sem:iri($objclass)),map:put($statsmap,"triplecount",map:get($statsmap,"triplecount") + 1),map:put($statsmap,"entitycount",map:get($statsmap,"entitycount") + 1))
        ,
          (: Process each column value :)
          for $col in $row/element()
          let $predicate := fn:concat($objclass , "#" , m:rdfescape($col/fn:local-name(.)))
          
          let $rawtype := $descriptions[./COLUMN_NAME = $col/fn:local-name(.)]/COLUMN_TYPE/text()
          (:let $l := xdmp:log($rawtype):)
          let $basetype := fn:tokenize($rawtype,"\(")[1]
          let $l := xdmp:log($basetype)
          let $xmltype := map:get($types,$basetype)
          let $l := xdmp:log($xmltype)
          
          (: format the $object primitive such that the data type is carried through :)
          let $object :=
            (:
            if ($xmltype = "xs:string") then
              fn:concat($col/text(),"^^xs:string") 
            else if ($xmltype = "xs:integer") then
              fn:concat($col/text(),"^^xs:integer")
            else if ($xmltype = "xs:dateTime") then
              fn:concat(m:sqlToXmlDatetime($col/text()),"^^xs:dateTime")
            else
              $col/text() 
            :)
            sem:typed-literal($col/text(),sem:iri($xmltype))
      
          return
            let $setl := sem:triple(sem:iri($subject),sem:iri($predicate),$object)
            let $l := xdmp:log($setl)
            return
            ($setl,map:put($statsmap,"triplecount",map:get($statsmap,"triplecount") + 1))
            
        ,
          (: add any relationships to tables where we have foreign keys in our table columns :)
          for $reftablename in fn:distinct-values($foreignkeycolumns/REFERENCED_TABLE_NAME/text())
          let $tablefks := $foreignkeycolumns[./REFERENCED_TABLE_NAME/text() = $reftablename]
          let $tablefkcount := fn:count($tablefks)
          let $predicate := fn:concat(
            $objclass , "#ref-" , fn:concat(
            for $fkt at $fkidx in $tablefks
            let $colname := $fkt/COLUMN_NAME/text()
            let $refcolname := $fkt/REFERENCED_COLUMN_NAME/text()
            return
              if ($fkidx gt 1) then 
                ";" 
              else
                $colname ))
          let $object := fn:concat(
            $base , m:rdfescape($reftablename) , "/" , fn:concat(
            for $fkt at $fkidx in $tablefks
            let $colname := $fkt/COLUMN_NAME/text()
            let $refcolname := $fkt/REFERENCED_COLUMN_NAME/text()
            return
              if ($fkidx gt 1) then 
                ";" 
              else
                fn:concat($refcolname , "=" , $row/element()[fn:local-name(.) = $colname]/text())))
          return
            (sem:triple(sem:iri($subject),sem:iri($predicate),sem:iri($object)),map:put($statsmap,"triplecount",map:get($statsmap,"triplecount") + 1))
            
            (: TODO add support for generating the reverse of all RDBMS relationships so we don't have to do inferencing later :)
            
        )
      (:let $to := xdmp:log("TRIPLES:-")
      let $tripout := xdmp:log($triples)
      let $to := xdmp:log("GRAPH:-")
      let $tripout := xdmp:log($graph):)
      let $insertresult := sem:graph-insert(sem:iri($graph), $triples) 
      (: let $insertresult := sem:graph-insert(sem:iri("somegraph"), (sem:triple(sem:iri("somesubject"),sem:iri("somepredicate"),sem:iri("someobject")))) :)
      (:let $insertresult := sem:rdf-insert($triples (:,(fn:concat("override-graph=",$graph)) :) ):)
      (: let $insertresult := fn:concat("/manualtriplestore/",xdmp:random(10000000000),".xml") :)
      (: let $ins := xdmp:document-insert($insertresult,<sem:triples>{$triples}</sem:triples>,xdmp:default-permissions(),(xdmp:default-collections(),$graph))  :)
      (: let $ins :=
      
let $s :=
      "xquery version '1.0-ml';
import module namespace sem = ""http://marklogic.com/semantics"" at ""/MarkLogic/semantics.xqy"";
       declare namespace my='http://mycompany.com/test';
       declare variable $my:triples as xs:string external;
       declare variable $my:graph as xs:string external;
       declare variable $my:docuri as xs:string external;
       let $p := sem:rdf-parse($my:triples,""ntriple"")
       let $l := xdmp:log($p)
       return sem:rdf-insert($p)"
       (:xdmp:document-insert($my:docuri,<sem:triples>{$my:triples}</sem:triples>,xdmp:default-permissions(),(xdmp:default-collections(),$my:graph)) " :)
return
    (: evaluate the query string $s using the variables
       supplied as the second parameter to xdmp:eval :)
    xdmp:eval($s, (xs:QName("my:triples"), sem:rdf-serialize($triples,"ntriple"), xs:QName("my:graph"), $graph, xs:QName("my:docuri"), $insertresult), <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><transaction-mode>update</transaction-mode><database>{xdmp:database("consolidation-content")}</database></options>)
    
      let $l := xdmp:log($ins)
      :)
      let $l := xdmp:log("insert result:-")
      let $l := xdmp:log($insertresult)
      
      return ()
      
      return (
        (: Commit this to a named graph rather than document so that MarkLogic handles the most performant storage mechanism :)
        (
          for $di in $insertresult
          return
            <m:docuri>{$di}</m:docuri>
        )
        ,
        
          for $r in $ex/text()
          return
            <m:error>{$r}</m:error>
        ,
          if (fn:empty($colnames)) then
            <m:error>The specified table has no columns defined. This is recoverable with no further action necessary. Continue as normal.</m:error>
          else ()
        ,
        <m:statistics>
          <m:triplecount>{map:get($statsmap,"triplecount")}</m:triplecount>
          <m:rowcount>{map:get($statsmap,"rowcount")}</m:rowcount>
          <m:entitycount>{map:get($statsmap,"entitycount")}</m:entitycount>
        </m:statistics>,
        <m:outcome>success</m:outcome>
        )
        (: return graph insert result doc IDs
  sem:graph-insert(sem:iri('bookgraph'), 
   sem:triple(sem:iri('urn:isbn:9780080540160'),
              sem:iri('http://purl.org/dc/elements/1.1/title'), 
              "Query XML,XQuery, XPath, and SQL/XML in context"))
        :)
        (: return result (with generation stats) :)
    }</m:ingestresult>
};

declare function m:rdfescape($str as xs:string) as xs:string {
  (: percent encode as per W3C RDB2RDF spec :)
  xdmp:url-encode($str,fn:true())
};

declare function m:sqlToXmlDatetime($t as xs:string) as xs:dateTime {
  let $pieces := fn:tokenize($t, " ")
  return
  if (fn:count($pieces) = 2) then (: For 2012-10-13 12:01:03.34 format :)
    let $timestamp := fn:concat($pieces[1],"T",$pieces[2])
    return xs:dateTime($timestamp)
  else (: For 2012 Oct 13 12:01:03.34 format :)
    let $map := <map><Jan>01</Jan><Feb>02</Feb><Mar>03</Mar><Apr>04</Apr><May>05</May><Jun>06</Jun><Jul>07</Jul><Aug>08</Aug><Sep>09</Sep><Oct>10</Oct><Nov>11</Nov><Dec>12</Dec></map>
    let $month := $map/*[name()=$pieces[2]]/text()
    let $timestamp := fn:concat($pieces[4],"-", $month,"-",$pieces[3],"T",$pieces[5])
    return xs:dateTime($timestamp)
};
