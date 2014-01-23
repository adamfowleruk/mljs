#!/bin/bash

usage(){
	echo "Usage: CUSTOM APP: $0 -m custom [-d /your/app/main/dir] [-j /sub/js/dir] [-i /sub/images/dir] [-c /sub/css/dir]"
	echo "Usage: ROXY: $0 -m roxy [-d /your/app/main/dir]"
	echo "Usage: REST: $0 -m rest [-d /your/app/main/dir]"
	echo "Usage: -d defaults to the current directory. For Roxy and Rest, this should be the parent of the src directory."
	echo "Usage: Roxy mode creates the mljstest controller and test pages too."
	exit 1
}

# Find latest temporary directory
T=${TMPDIR}mljsme

# Find application folder - -d option or PWD
ORIG=$PWD

APP=$ORIG

# Roxy full copy commands
while getopts ":c:j:i:m:d:" o; do
  case "${o}" in
    m)
      case "$OPTARG" in
        roxy)
          ROXY=true
          ;;
        rest)
          REST=true
          ;;
        *)
          CUSTOM=true
          ;;
      esac
      ;;
    j)
      J=$APP/$OPTARG
      ;;
    i)
      I=$APP/$OPTARG
      ;;
    c)
      C=$APP/$OPTARG
      ;;
    d)
      APP=$OPTARG
      ;;
    *)
      echo "$0: Unknown option specified"
      usage
      ;;
  esac
done

if [ $ROXY ]; then
  echo "Roxy mode"
  mkdir -p $APP/src
else
  if [ $REST ]; then
    echo "REST mode"
    C=$APP/src/css/mljs
    J=$APP/src/js/mljs
    I=$APP/src/images/mljs
    mkdir -p $C
    mkdir -p $J
    mkdir -p $I
  else
    echo "Custom mode"
    J=$APP/src/public/js/mljs
    C=$APP/src/public/css/mljs
    I=$APP/src/public/images
    
    # Ensure destination folders exist
    mkdir -p $C
    mkdir -p $J
    mkdir -p $I
  fi
fi

echo "-d=$APP -j=$J -i=$I -c=$C -roxy=$ROXY"

# make new temp folder
mkdir $T

# TODO check for existence of wget or curl and use the most appropriate, or print a helpful error message about installation each
# -bash: wget: command not found
#adam-mac:~ adamfowler$ /bin/sh flibble
#/bin/sh: flibble: No such file or directory
#adam-mac:~ adamfowler$ flibble
#-bash: flibble: command not found

RETVAL=`wget --version`
if [[ "$RETVAL" =~ ".*command not found.*" ]]; then
  WGET=false
else
  WGET=true
fi

RETVAL=`curl --version`
if [[ "$RETVAL" =~ ".*command not found.*" ]]; then
  CURL=false
else
  CURL=true
fi

if [ $CURL ]; then
  echo "Got CURL"
else
  echo "No CURL"
fi

if [ $WGET ]; then
  echo "Got WGET"
else
  echo "No WGET"
fi

$WGET=false

# Fetch latest MLJS download tar.gz file
cd $T
if [ $WGET ]; then
  wget -nd --no-check-certificate https://raw.github.com/adamfowleruk/mljs/master/dist/mljs-browser.tar.gz
else
  if [ $CURL]; then
    curl -o mljs-browser.tar.gz https://raw.github.com/adamfowleruk/mljs/master/dist/mljs-browser.tar.gz
  else
    echo "$0: Neither CURL nor WGET are installed. One must be installed to use mljsme.sh"
    usage
  fi
fi

# Unpack in to new temp folder
tar xzf mljs-browser.tar.gz
cd dist/mljs/browser-raw

if [ $ROXY ]; then
  echo "Roxy mode copies"
  # copy required and test files
  cp -R roxy/* $APP/
else
  echo "Custom mode copies"
  # Copy relevant files only
  cp -f js/* $J/
  cp -f images/* $I/
  cp -f css/* $C/
fi

# delete temp folder
cd $ORIG
rm -rf $T

# Print instructions for adding script and css links in to HTML

# Exit successfully
echo "Done."
echo "Remember, you can alias me by adding this line to your ~/.bash_profile: alias mljsme=/your/path/to/mljsme.sh "$@""
exit 0
