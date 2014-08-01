# Running your application

The MLJS Web Server package you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions:-

## Installing dependencies

Ensure you have Node.js set up and installed.

Also install the following modules using these commands:-
1. npm install mljs
2. npm install crypto
3. npm install underscore

## Configure the application for your environment

Before you begin, ensure you have a content database set up with a REST API server in MarkLogic configured to
look at it.

1. Edit webserver-settings.sh
2. Alter the settings for your system - typically just RESTHOST and RESTPORT
3. Save and clost the file
4. Ensure you can execute it by changing it's permissions. Execute this: chmod u+x \*.sh

## Execute the web server

Run the web server: ./run-webserver.sh

This will keep a terminal window open showing

## View your web application

Point your browser at http://localhost:5002/index.html5

Note the above assumes your app in it's SRC folder has an index.html5. Alter this URL for your paticular application.


## Getting help

Contact the distributor of your application in the first instance.
