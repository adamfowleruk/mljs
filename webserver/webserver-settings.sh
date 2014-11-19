#!/bin/sh

# 1. Replace these items with those for your system


# Hostname or IP address
RESTHOST=localhost
# You specify the content database by choosing the REST server instance pointint to that database
RESTPORT=8009
XCCPORT=8010



# 2. Set the following for your database if using the create-rest-server.sh script

# Database name
DATABASE=Documents
MLADMINUSER=admin
MLADMINPASS=admin
# The below are a temporary hack for the lack of pass through authentication in the webserver node code
MLAUTH=digest
MLDEFAULTUSER=nobody


# 3. Only alter the below if you know what you are doing

# The port that your web browser will look at for an application
WEBPORT=5001
# The port that MarkLogic will fire alerts and documents at
ALERTPORT=5002
# Relative or absolute path to the SRC folder of your REST app
APPPATH=./src
# default fallback path
DEFAULTPATH=/workplace.html5

MLCP=/Users/adamfowler/Documents/marklogic/software/mlcp-Hadoop2-1.2-1/bin/mlcp.sh

