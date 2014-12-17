#!/bin/sh

# Config params here

. ./config/webserver-settings.sh

curl -X POST --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: text/xml" -d@"./config/mljs-workplace.xml" \
    "http://$RESTHOST:$RESTPORT/v1/resources/workplace"

echo "Completed installing ./config/mljs-workplace.xml in the server's content database"
exit 0
