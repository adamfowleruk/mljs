# Running your application

The MLJS Web Server package you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions:-

## Installing dependencies

Ensure you have Node.js set up and installed.

Also install the following modules using these commands:-
1. npm install mljs
2. npm install crypto
3. npm install underscore

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

## Execute the web server

Run the web server: ./run-webserver.sh

This will keep a terminal window open showing that it is running, and on which port.

## View your web application

Point your browser at http://localhost:5001/index.html5

Note the above assumes your app in it's SRC folder has an index.html5. Alter this URL for your paticular application.

## Getting help

Contact the distributor of your application in the first instance.
