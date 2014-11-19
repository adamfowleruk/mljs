#!/bin/sh

# Config params here

. ./webserver-settings.sh

mkdir -p data

curl -X GET --anyauth --user $MLADMINUSER:$MLADMINPASS  \
    "http://$RESTHOST:$RESTPORT/v1/resources/workplace" > data/mljs-workplace.xml

echo "Capture complete. Output in ./data/mljs-workplace.xml"
exit 0
