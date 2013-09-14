[Back to All Tutorials list](tutorial-all.html)
# A MarkLogic Ontology

I've been working with MarkLogic 7 features a lot recently. These centre around the concept of Subjects, Predicates and Objects - triples. Examples include 'Adam knows Wendy' or 'Wendy likes Cheese'.

There are some predicates, or properties, that should stay in the content world, but some that could live in the triple world, or be migrated from relational to triples.

This document tries to summarise ones I have come across. I may create my own ontology for this information. This is a starter document for that ontology.

Properties that should stay as MarkLogic's content properties:-
- created (datetime)
- updated (datetime)
- createdby (ML username)
- updatedby (ML username)

Below are some predicates I've used in the past:-
- graphuri derived_from docuri
- any_subject_iri mentioned_in docuri

And some third party ontologies I've used:-
- FOAF - Friend of a Friend. For modelling people and organisations and their linkages
- Geonames - For places and their locations

Other ideas for predicates that may be useful in MarkLogic
- Concepts around documents - what project are they part of? Who is on the project? What roles do they have on the project? What roles do they have on the document? (Reviewer, originator, etc.)

Some operations this ontology allows:-
- Find all Joint Customers with a Bank balance below 100 GBP, whose Insurance client IDs are mentioned in claims documents, but only those with claims documents that mentioned the word 'pedestrian'
- Find all Senior Geologists in our organisation where they have contributed to documents that have been tagged with the keywords 'geology' and 'iceland'


## TODO example relationships and queries

1. Graph derived from (graph outside of doc)



2. Entity mentioned in a document (facts embedded within doc)

- - - -

[Back to All Tutorials list](tutorial-all.html)