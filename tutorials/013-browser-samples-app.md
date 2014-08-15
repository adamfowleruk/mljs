[Back to All Tutorials list](tutorial-all.html)
# Installing the MLJS Samples App

## Using the MLJS Workplace app

The default app to use now is the MLJS Workplace app. This provides a default HTML wrapper, and visually configurable
web application. This requires ZERO CODING to get started with using MLJS widgets on your own content database!

Simply download the app from the dist folder on GitHub. It's called app-workplace.tar.gz, and contains a README
file with how to quickly get up and running!

## Using the mljsrest app

An older, coded pages, pure REST API MLJS app is available called mljsrest. This can be downloaded and used just like
the above workplace app, but the pages are hard coded in JavaScript. Useful if working on your own HTML application.

Download the app from the dist folder on GitHub. It's called app-mljsrest.tar.gz.


## DEPRECATED: Roxy hybrid mldbwebtest application

MLJS ships with a samples app called mldbwebtest. You can install this and browse through the available
visual widgets to see what is possible.

This app ships as a Roxy Hybrid browser app. Roxy is an app deploy tool and convention-over-coding
Ruby on Rails like web app framework. All I'm using it for is a basic web controller and as a deploy
tool.

To install the samples app:-

1. Open a terminal
2. cd to the mldbwebtest application
3. Edit the mldbwebtest/deploy/build.properties file
4. Change the admin username, password, app port and app host to suit your MarkLogic installation
5. IMPORTANT: If an ML 7 installation, uncomment the server-version=7 line (or add if it isn't there)
6. Save the build.properties file
7. Type ./ml local bootstrap (Note: You MUST use ./ to select this Roxy version, not any other that may be installed on your machine)
8. Now type ./ml local deploy modules
9. Now open a browser and visit http://localhost:8120/

This will send you to the main mldbtest controller page. This will check for indexes and install any missing content for you.
Once this returns 'Done' you will be able to visit any of the sample pages using the top navigation on the page.

- - - -

[Back to All Tutorials list](tutorial-all.html)
