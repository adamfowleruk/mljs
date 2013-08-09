[Back to All Tutorials list](tutorial-all.html)
# Installing MLJS in to an existing application

WARNING: Currently MLJS can only run in a REST API application installed directly in to MarkLogic server. 
It cannot be integrated to an application on another server, or that sits on a port that is not a REST API
instance in MarkLogic. In future I will implement W3C CORS support to bypass this.

You may have an existing Roxy application or just a few html pages installed in a REST Server instance. If
you do and you want to use MLJS then how do you get started?

Thankfully I've created a handy script that downloads the latest MLJS browser files and installs them to 
a Roxy app folder of your choice. 

1. To get this script go to https://github.com/adamfowleruk/mljs and download the mljsme.sh file.
2. Install this script in a useful location. I'm going to assume it's in /Users/adamfowler/Documents/utilities/mljsme.sh
3. Open a terminal session and edit your bash profile: vi ~/.bash_profile
4. Add this line to it: alias mljsme=/Users/adamfowler/Documents/utilities/mljsme.sh "$@"
5. Save the file and quit vi
6. Exit all current terminals (only new terminals will pick up the alias)

## Installing MLJS in to a Roxy Hybrid application

The mljsme script when executed will check for a -d option. This specifies the root folder of the Roxy app that
MLJS should be installed in. i.e. the one that contains a 'src' and 'deploy' folder. If a -d option is not 
specified then mljsme assumes the present working directory is where your Roxy app resides.

1. Open a terminal window
2. cd in to your existing Roxy Hybrid application's folder
3. type ```mljsme``` and hit enter

## Installing MLJS in a vanilla REST Server instance

the mljsme script by default assumes that javascript, css and image files should be installed in the
./src/public/js ./src/public/css and ./src/public/images folders, respectively. This matches the
architecture of a Roxy application.

To install MLJS in your own REST application with a different structure, you use the -j, -i and -c
options for the javascript, images, and css folders, respectively. Consider the following command:-

``mljsme -d /Users/adamfowler/Documents/git/myownapp -j javascript -i assets/images -c assets/css``

This command will install the MLJS javascript files in to the javascript subfolder within the myownapp
folder. Similar happens for images and css. Each option assumes that the -d (or present working directory
if -d is not specified) is the parent folder of the subfolder option specified.

WARNING: As of Fri 09 Aug 2013 the -j, -i and -c options are not working as expected. Please check back for
updates, or suggest a fix yourself.

## What does MLJSME do?

The script does several things in order:-

1. Creates a new temporary directory for downloaded files
2. Downloads the latest mljs-browser.tar.gz distribution file from MLJS GitHub
3. Unpacks this in the temporary folder
4. Copies the relevant files to the folders specified (Will always overwrite existing files with same names)
5. Cleans up the temporary files created

Please let me know how you get on with this script.

- - - -

[Back to All Tutorials list](tutorial-all.html)