# Running your application

The MLJS Web Server package you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions.

*WARNING: All instructions assume you have downloaded an MLJS Web Server based app.
If instead you are reading this README on the GitHub website, then please download
the dist/app-<myapp>.tar.gz or zip file before proceeding.*

## Install Node.js

*WARNING*: Ensure you have Node.js set up and installed.

- On Windows, go to http://nodejs.org/download/ and install Node.js
- On Mac, either do brew install node OR download from the above link
- On Linux, either download from the above link, or follow instructions here: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
 - WARNING: open a terminal and login as root first using 'su -'
 - WARNING: Also be sure to install build tools by doing this before installing nodejs: sudo yum install -y gcc-c++ make

This will give you the runtime files and the npm utility for installing modules.


## Installing dependencies

Also install the following modules using these commands:-

1. Logout as root if you are logged in to the terminal via su -
2. npm set registry https://registry.npmjs.org/
3. npm update
4. cd dist/<myappname> (Or the folder you have unzipped your app in to - the one that contains this README.md file)
5. npm install crypto
6. npm install underscore
7. npm install restify
8. npm install url
9. npm install websocket

## Install MLJS

There are two options for installing MLJS - the latest stable version, or the in progress DEV branch. If you are in
pre-sales in MarkLogic, or wish to contribute code to MLJS, then work on the DEV version by following Route B below.
The vast majority of people will go Route A though.

Choose ONE route only.

### Route A: Latest stable MLJS

The preferred route:-

1. cd dist/<myappname> (Or the folder you have unzipped your app in to - the one that contains this README.md file)
2. npm install mljs

### Route B: Latest development MLJS

Useful if in pre-sales and wanting the latest features

1. cd to the location you have done a git checkout for mljs in (the directory with package.json in)
2. run sudo npm link
3. cd to the folder containing this README file (with the run-webserver.sh file in)
4. run npm link mljs here

## Configure options for your environment

1. Edit webserver-settings.sh
2. Alter the settings for your system - typically just RESTHOST and RESTPORT
3. Save and close the file
4. Ensure you can execute it and other scripts by changing it's permissions. Execute this: chmod u+x \*.sh

## Optional: Create a REST server instance

If you don't already have a REST server pointing to your content database then use the following procedure.

1. Edit webserver-settings.sh and ensure you've specified a correct value for the DATABASE, MLADMINUSER and MLADMINPASS variables
2. Execute the script: ./create-rest-server.sh

You will see a confirmation that the server has been created.

## A note on security

The mljs-webserver automatically handles authentication requests from MarkLogic, passing them back to the client browser.
Basically the mljs-webserver acts as a HTTP proxy.

This has been tested again application level security, digest, basic, and digestbasic on MarkLogic 7. All work well.

The webserver currently uses HTTP only, not HTTPS. This may be added in future. Certificate or Kerberos based auth is
not yet supported. Please log an issue on the MLJS GitHub site if you want this adding.

## Configure search options

MLJS falls back to search options called 'all'. Ensure you at least have these installed in the server before creating
a search page. Upload them using curl and the REST API to your rest server instance.

A helper script has been created for you. To use that do the following:-
1. edit all.xml to reflect your own search options
2. Save the file
3. execute ./add-search-options.sh all all.xml xml

Note in the above all is the search options name, all.xml is the file, and xml is the type (json also permitted).

Documentation on search options allowed are here:-

- XML: http://docs.marklogic.com/guide/rest-dev/appendixb
- JSON: http://docs.marklogic.com/guide/rest-dev/appendixa

## Execute the web server

Run the web server: ./run-webserver.sh

This will keep a terminal window open showing that it is running, and on which port.

## Installing Keylines

The keylines javascript library is commercial, so you must download this yourself if you want to use it.

To add keylines to your demo, unzip your keylines folder and place under src:-

Should be named: ./src/keylines

DO NOT separate out in to separate js, images and css folders

## View your web application

Point your browser at http://localhost:5001/index.html5

Note the above assumes your app has an index.html5 file in its SRC folder. Alter this URL for your paticular application.


## Getting help

Contact the distributor of your application in the first instance.
