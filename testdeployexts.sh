#!/bin/sh

. test-settings.sh

URLSDEP="http://$RESTHOST:$RESTPORT/v1/config/resources/subscribe"
URLSRES="http://$RESTHOST:$RESTPORT/v1/ext/app/models/lib-search-subscribe.xqy"
USERPASS="$MLADMINUSER:$MLADMINPASS"

echo "Installing subscribe dependencies"
curl -v --anyauth --user $USERPASS -X PUT \
    -H "Content-type: application/xquery" -d@"./apps/workplace/src/app/models/lib-search-subscribe.xqy" \
    $URLSDEP

echo "Installing subscribe resource extension"
curl -v --anyauth --user $USERPASS -X PUT \
    -H "Content-type: application/xquery" -d@"./apps/workplace/rest-api/ext/subscribe-resource.xqy" \
    $URLSRES

echo "Done"
exit 0
