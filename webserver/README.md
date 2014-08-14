# Running your application

The MLJS Web Server package you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions:-

## Install MLJS

### Route A: Latest stable MLJS

The preferred route:-

1. npm install mljs

### Route B: Latest development MLJS

Useful if in pre-sales and wanting the latest features

1. cd to the location you have done a git checkout for mljs in (the directory with package.json in)
2. run sudo npm link
3. cd to the folder containing this README file (with the run-webserver.sh file in)
4. run npm link mljs here

## Installing dependencies

Ensure you have Node.js set up and installed.

Also install the following modules using these commands:-

1. npm install crypto
2. npm install underscore
3. npm install websocket

## Configure options for your environment

1. Edit webserver-settings.sh
2. Alter the settings for your system - typically just RESTHOST and RESTPORT
3. Save and clost the file
4. Ensure you can execute it and other scripts by changing it's permissions. Execute this: chmod u+x \*.sh

## Optional: Create a REST server instance

If you don't already have a REST server pointing to your content database then use the following procedure.

1. Edit webserver-settings.sh and ensure you've specified a correct value for the DATABASE, MLADMINUSER and MLADMINPASS variables
2. Execute the script: ./create-rest-server.sh

You will see a confirmation that the server has been created.

## Workaround: set security on webapp

This is needed because currently the web server does not support passing through HTTP 401 security auth requests. This
will be added in an upcoming release.

1. Login to http://localhost:8001/
2. Find the HTTP server for your REST Server
3. Change authentication type to 'application'
4. Change default user to 'admin'
5. Save settings

## Configure search options

MLJS falls back to search options called 'all'. Ensure you at least have these installed in the server before creating
a search page. Upload them using curl and the REST API to your rest server instance.

A helper script has been created for you. To use that do the following:-
1. edit all.xml to reflect your own search options
2. Save the file
3. execute ./add-search-options.sh all all.xml xml

Note in the above all is the search options name, all.xml is the file, and xml is the type (json also permitted).

## Execute the web server

Run the web server: ./run-webserver.sh

This will keep a terminal window open showing that it is running, and on which port.

## View your web application

Point your browser at http://localhost:5001/index.html5

Note the above assumes your app in it's SRC folder has an index.html5. Alter this URL for your paticular application.


## Getting help

Contact the distributor of your application in the first instance.
