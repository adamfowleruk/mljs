#!/bin/bash

# Find latest temporary directory
T=${TMPDIR}mljsme

# Find application folder - -d option or PWD
ORIG=$PWD
getopts "d:" MINUSD
echo "MINUSD: $MINUSD or $OPTARG"
if [ -z "$OPTARG" ]
then APP=$PWD
else APP=$OPTARG
fi

# TODO sanity check folder for Roxy common files - E.g. deploy and src folders in PWD

# Check if -j or -i or -c specified for js, images and css files accordingly
# If not, assume ./public/js, ./public/images, ./public/css
getopts "j:" MINUSJ
if [ -z "$OPTARG" ]
then J=$APP/src/public/js/mljs
else J=$APP/$OPTARG
fi
getopts "c:" MINUSC
if [ -z "$OPTARG" ]
then C=$APP/src/public/css/mljs
else C=$APP/$OPTARG
fi
getopts "i:" MINUSI
if [ -z "$OPTARG" ]
then I=$APP/src/public/images
else I=$APP/$OPTARG
fi
echo "-d=$APP -j=$J -i=$I -c=$C"

# make new temp folder
mkdir $T

# Ensure destination folders exist
mkdir -p $C
mkdir -p $J
mkdir -p $I

# TODO check for existence of wget or curl and use the most appropriate, or print a helpful error message about installation each
# -bash: wget: command not found
#adam-mac:~ adamfowler$ /bin/sh flibble
#/bin/sh: flibble: No such file or directory
#adam-mac:~ adamfowler$ flibble
#-bash: flibble: command not found

# Fetch latest MLJS download tar.gz file
cd $T
wget -nd --no-check-certificate https://raw.github.com/adamfowleruk/mljs/master/dist/mljs-browser.tar.gz

# Unpack in to new temp folder
tar xzf mljs-browser.tar.gz
cd dist/mljs/browser-raw

# Copy relevant files
cp -f js/* $J/
cp -f images/* $I/
cp -f css/* $C/

# delete temp folder
cd $ORIG
rm -rf $T

# Print instructions for adding script and css links in to HTML

# Exit successfully
echo "Done."
echo "Remember, you can alias me by adding this line to your ~/.bash_profile: alias mljsme=/your/path/to/mljsme.sh "$@""
exit 0
