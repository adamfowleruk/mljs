#!/bin/sh
. ./webserver-settings.sh

node run-mljs-webserver.js $WEBPORT $ALERTPORT $APPPATH $RESTHOST $RESTPORT $DEFAULTPATH
