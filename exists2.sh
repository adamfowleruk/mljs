#!/bin/sh

echo "Does mldbtest exist?"
curl -v --digest --user admin:admin -X GET -i \
  "http://localhost:8002/v1/rest-apis?database=mldbtest&format=json"


