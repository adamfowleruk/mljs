#!/bin/sh

./cpjs.sh

mkdir ./build
T=./build/mldb-browser
mkdir $T
mkdir $T/js
mkdir $T/jstest
mkdir $T/css
D=./mldbwebtest/src/public/js/mldbtest
cp $D/mldb*.js $T/js/
cp $D/widget*.js $T/js/
cp $D/events.js $T/js/
cp $D/widgets.css $T/css/
cp $D/page*.js $T/jstest/

cp BROWSER.md $T/README.txt

cd ./build
tar czf ../mldb-browser.tar.gz mldb-browser
zip -vr ../mldb-browser.zip mldb-browser/
cd ..

rm -rf ./build

echo "Done."
