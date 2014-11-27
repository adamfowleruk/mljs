#!/bin/sh

# Config params here

. ./config/webserver-settings.sh

mkdir -p data

curl -X GET --anyauth --user $MLADMINUSER:$MLADMINPASS  \
    "http://$RESTHOST:$RESTPORT/v1/resources/workplace" > config/mljs-workplace.xml

echo "Capture complete. Output in ./config/mljs-workplace.xml"
exit 0
