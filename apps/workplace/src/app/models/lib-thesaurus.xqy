xquery version "1.0-ml";
module namespace facet="http://marklogic.com/xdmp/thesaurus";
import module namespace search = "http://marklogic.com/appservices/search" at "/MarkLogic/appservices/search/search.xqy";
import module namespace thsr="http://marklogic.com/xdmp/thesaurus" at "/MarkLogic/thesaurus.xqy";

(:
 : Creates a cts:or-query of cts:word queries based on the words provided in the query.
 : Uses the thesaurus functions in MarkLogic
 :
 : NOTE: ALTER the /admin/thesaurus/riot.xml file to YOUR THESAURUS XML FILE
 :
 : NOTE: This is used by mljs.options.thesaurusConstraint
 :)
declare function facet:parse(
  $constraint-qtext as xs:string,
  $right as schema-element(cts:query))
as schema-element(cts:query)
{
  let $term := fn:string($right//cts:text)
  return 
    let $th := thsr:expand(
     cts:word-query($term), 
     thsr:lookup("/admin/thesaurus/mywords.xml", $term),
     0.25, 
     (), 
     () )
    return
      <root>{cts:or-query((cts:word-query($term),$th))}</root>/*
};

(:)
declare function facet:parse(
  $constraint-qtext as xs:string,
  $right as schema-element(cts:query))
as schema-element(cts:query)
{
  (: <root>{cts:collection-query(fn:string($right//cts:text))}</root>/* :)
  let $term := fn:string($right//cts:text)
  return <root>{thsr:expand(
     cts:word-query($term), 
     thsr:lookup("/admin/thesaurus/riot.xml", $term),
     0.25, 
     (), 
     () )}</root>/*
};
:)