# Running your application

The MLJS Web Server based application you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions.

## Edit desired system settings

Note: You don't have to do this step if you have installed via a Yeoman generator.

1. Edit config/env.js to reflect your desired environment (NOTE: Port numbers MUST be unique for MarkLogic and not in use)
2. Edit config/database-settings.sh to reflect your environment
3. Save both and quit the editor

## Install Node.js requirements

Note: You don't have to do this step if you have installed via a Yeoman generator.

1. You need to install Node.js to run all the deploy tools and code
2. Now install dependencies by issuing: npm install
3. Now wait until all dependencies are installed

## Customise the app

1. Edit data/restapi.json to configure what REST extensions and triggers you want installing
2. Edit config/env.js and config/database-settings.sh if you incorrectly set system details during Yeoman generator install

## Install the app itself

1. Install the app using mljsadmin. Type: ./mljsadmin install
2. There is a bug in this version of mljsadmin, so you need to run an extra command. Issue ./mljsadmin update

## Install ISYS triggers and filters

This is done for you automatically by mljsadmin if they are described within data/restapi.json.

## Run the webserver

1. In a terminal type: ./mljsserve

## View the application

Your app is now deployed. Visit http://localhost:5001/index.html5 to view it

Any issues contact adam.fowler@marklogic.com for assistance.
