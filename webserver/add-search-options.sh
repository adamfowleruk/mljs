#!/bin/sh

. webserver-settings.sh

URL="http://$RESTHOST:$RESTPORT/v1/config/query/$1?format=$3"

echo "Creating search options called $1 of format $3 with file name $2"
curl -v -X PUT \
    -d@"$2" \
    -H "Content-type: application/json" \
    $URL

echo "Done"
exit 0
