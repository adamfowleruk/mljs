#!/bin/sh

# 1. Replace these items with those for your system


# Hostname or IP address
RESTHOST=192.168.123.225
# You specify the content database by choosing the REST server instance pointint to that database
RESTPORT=9090



# 2. Set the following for your database if using the create-rest-server.sh script

# Database name
DATABASE=mldbtest
MLADMINUSER=admin
MLADMINPASS=admin
# The below are a temporary hack for the lack of pass through authentication in the webserver node code
MLAUTH=digest
MLDEFAULTUSER=nobody
