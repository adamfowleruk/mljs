# Running your application

The MLJS Web Server based application you are currently look at was built so you could quickly get started with
a MarkLogic REST application. In order to do this you need to follow the below instructions.

## Edit desired system settings

Note: You don't have to do this step if you have installed via a Yeoman generator.

1. Edit config/env.js to reflect your desired environment (NOTE: Port numbers MUST be unique for MarkLogic and not in use)
2. Edit config/database-settings.sh to reflect your environment
3. Save both and quit the editor

## Install Node.js MarkLogic admin tools

1. You need mljsadmin and mljsserve to run this demo. To install this, install mlnodetools GLOBALLY like this:
  - npm install -g mlnodetools
2. If you receive permission warnings, follow this advice, and then try the above command again: https://docs.npmjs.com/getting-started/fixing-npm-permissions
3. Test by typing just 'mljsadmin' with no parameters from the command line (this MUST be issued in the root folder of your app)

## Customise the app

1. Edit data/restapi.json to configure what REST extensions and triggers you want installing
2. Edit config/env.js and config/database-settings.sh if you incorrectly set system details during Yeoman generator install

## Install the app itself

1. Install the app using mljsadmin. Type: mljsadmin install
2. There is a bug in this version of mljsadmin, so you need to run an extra command. Issue mljsadmin update
3. Also load the initial content. Type: mljsadmin load

## Install ISYS triggers and filters

This is done for you automatically by mljsadmin if they are described within data/restapi.json.

## Run the webserver

1. In a terminal type: mljsserve

## View the application

Your app is now deployed. Visit http://localhost:5001/index.html5 to view it

Any issues contact adam.fowler@marklogic.com for assistance.
