#!/bin/sh

# Config params here

. ./webserver-settings.sh

curl -X POST --anyauth --user $MLADMINUSER:$MLADMINPASS -H "Content-type: text/xml" -d@"./data/mljs-workplace.xml" \
    "http://$RESTHOST:$RESTPORT/v1/resources/workplace"
