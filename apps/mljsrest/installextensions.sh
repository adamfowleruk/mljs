#!/bin/sh

# Config params here

export USER="admin"
export PASS="admin"
export HOST="192.168.123.133"
export RESTPORT="8122"

# Install code - do not modify

#curl -X PUT --anyauth --user admin:admin -H "Content-type: application/xquery" -d@"./subscribe-resource.xqy" \
#    "http://localhost:8008/v1/config/resources/subscribe?title=Alert Subscription&version=1.0&provider=marklogic&description=Subscribe to local events&method=get&method=post&method=put&method=delete&put:nodeurl=xs:string*&put:point=xs:string*&radiusmiles=xs:float"

#curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-ext/whoami.xqy" \
#  "http://$HOST:$RESTPORT/v1/config/resources/whoami?method=get"

    

curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-api/ext/version.xqy" \
    "http://$HOST:$RESTPORT/v1/config/resources/version"
    
curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-api/ext/rdb2rdf.xqy" \
    "http://$HOST:$RESTPORT/v1/config/resources/rdb2rdf"

echo "Done."
exit 0
