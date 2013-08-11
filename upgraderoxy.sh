#!/bin/bash

# Find latest temporary directory
T=${TMPDIR}upgraderoxy

# Find application folder - -d option or PWD
O=$PWD

# make new temp folder
mkdir $T

# Fetch latest MLJS download tar.gz file
cd $T
wget -nd --no-check-certificate https://codeload.github.com/marklogic/roxy/zip/dev

# Unpack in to new temp folder
unzip dev
cd roxy-dev 

# Copy relevant files
cp -r deploy/* $O/mldbwebtest/deploy
cp -r src/roxy/* $O/mldbwebtest/src/roxy
cp ml $O/mldbwebtest/ml
cp ml.bat $O/mldbwebtest/ml.bat
cp version.txt $O/mldbwebtest/version.txt
cp CHANGELOG.mdown $O/mldbwebtest/CHANGELOG.mdown

# delete temp folder
cd $O
rm -rf $T

# Print instructions for adding script and css links in to HTML

# Exit successfully
echo "Done."
exit 0
