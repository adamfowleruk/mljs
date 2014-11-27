#!/bin/sh

. ./config/webserver-settings.sh

URL="http://$RESTHOST:8002/v1/rest-apis"
USERPASS="$MLADMINUSER:$MLADMINPASS"

echo "Creating rest server for $DATABASE on port $RESTPORT for server $RESTHOST"
curl -v --anyauth --user $USERPASS -X POST \
    -d"{\"rest-api\":{\"name\":\"$DATABASE-rest-$RESTPORT\",\"database\": \"$DATABASE\",\"modules-database\": \"$DATABASE-rest-modules\",\"port\": $RESTPORT}}" \
    -H "Content-type: application/json" \
    $URL

echo "Done"
exit 0
