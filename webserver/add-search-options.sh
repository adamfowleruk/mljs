#!/bin/sh

. ./config/webserver-settings.sh

URL="http://$RESTHOST:$RESTPORT/v1/config/query/$1?format=$3"
USERPASS="$MLADMINUSER:$MLADMINPASS"

echo "Creating search options called $1 of format $3 with file name $2"
curl -v --anyauth --user $USERPASS -X PUT \
    -d@"./rest-api/config/options/$2" \
    -H "Content-type: application/json" \
    $URL

echo "Done"
exit 0
