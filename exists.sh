#!/bin/sh

echo "Does mldbtest-rest-9090 exist?"
curl --anyauth --user admin:admin -X GET -i \
  http://localhost:8002/v1/rest-apis/mldbtest-rest-9090?format=json

echo "Does mldbtest exist?"
curl --anyauth --user admin:admin -X GET -i \
  http://localhost:8002/v1/rest-apis/mldbtest?format=json


