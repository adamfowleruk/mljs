#!/bin/sh


curl -v --anyauth --user admin:admin -X DELETE \
    -H "Content-type: application/json" \
    "http://localhost:8002/v1/rest-apis/configtest?include=content&include=modules"
