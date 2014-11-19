#!/bin/sh

# Config params here

. ./webserver-settings.sh

# Install code - do not modify

#curl -X PUT --anyauth --user admin:admin -H "Content-type: application/xquery" -d@"./subscribe-resource.xqy" \
#    "http://localhost:8008/v1/config/resources/subscribe?title=Alert Subscription&version=1.0&provider=marklogic&description=Subscribe to local events&method=get&method=post&method=put&method=delete&put:nodeurl=xs:string*&put:point=xs:string*&radiusmiles=xs:float"

#curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-ext/whoami.xqy" \
#  "http://$HOST:$RESTPORT/v1/config/resources/whoami?method=get"


#curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-ext/dls.xqy" \
#    "http://$HOST:$RESTPORT/v1/config/resources/dls?method=get&method=put&get:uri=xs:string&get:collection=xs:string&put:uri=xs:string&put:collection=xs:string"

#curl -X PUT --anyauth --user $USER:$PASS -H "Content-type: application/xquery" -d@"./rest-ext/dlsrules.xqy" \
#    "http://$HOST:$RESTPORT/v1/config/resources/dlsrules?method=get&method=put&get:rulename=xs:string"




curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/workplace.xqy" \
    "http://$RESTHOST:$RESTPORT/v1/config/resources/workplace?method=get&method=put"

curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/version.xqy" \
    "http://$RESTHOST:$RESTPORT/v1/config/resources/version?method=get"

#curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/process-exifdata.xqy" \
#    "http://$RESTHOST:$RESTPORT/v1/config/resources/process-exifdata?method=get"
#curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/process-contact.xqy" \
#    "http://$RESTHOST:$RESTPORT/v1/config/resources/process-contact?method=get"
#curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/process-phone.xqy" \
#    "http://$RESTHOST:$RESTPORT/v1/config/resources/process-phone?method=get"
#curl -X PUT --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: application/xquery" -d@"./rest-api/ext/get.xqy" \
#    "http://$RESTHOST:$RESTPORT/v1/config/resources/get?method=get"
