#!/bin/sh

# Config params here

. webserver-settings.sh

curl -X GET --anyauth --user $MLADMINUSER:$MLADMINPASS  \
    "http://$RESTHOST:$RESTPORT/v1/resources/workplace" > data/mljs-workplace.xml
