#!/bin/sh


curl -v --anyauth --user admin:admin -X DELETE \
    -H "Content-type: application/json" \
    http://localhost:8002/v1/rest-apis/mldbtest-rest-9090?include=content,modules
