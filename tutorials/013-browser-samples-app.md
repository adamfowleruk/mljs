[Back to All Tutorials list](tutorial-all.html)
# Installing the MLJS Samples App

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