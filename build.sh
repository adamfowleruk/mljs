#!/bin/sh

rm -rf dist
mkdir dist
mkdir dist/mldb
mkdir dist/mldb/nodejs-raw
mkdir dist/mldb/nodejs-raw/lib
mkdir dist/mldb/browser-raw
mkdir dist/mldb/browser-raw/js
mkdir dist/mldb/browser-raw/css
mkdir dist/mldb/browser-raw/test
mkdir dist/mldb/nodejs-minified
mkdir dist/mldb/nodejs-minified/lib
mkdir dist/mldb/browser-minified
mkdir dist/mldb/browser-minified/js
mkdir dist/mldb/browser-minified/css
mkdir dist/mldb/browser-minified/test

P=../mldb-pages/apidocs
S=./mldbwebtest/src/public/js/mldbtest
L=./lib
D=./dist/mldb/browser-minified
DJ=$D/js
N=./dist/mldb/nodejs-raw
NM=./dist/mldb/nodejs-minified
R=./dist/mldb/browser-raw
RJ=$R/js
J=./build-lib/jsmin

./cpjs.sh

cp $L/*.js $N/lib/
cp mldb.js $RJ/
cp mldb.js $N/
cp $S/mldb-*.js $RJ/
cp $S/widget*.js $RJ/
cp $S/highcharts.js $RJ/

$J < $S/mldb.js > $DJ/mldb.js
cp $DJ/mldb.js $NM/
$J < ./lib/basic-wrapper.js > $NM/lib/basic-wrapper.js 
$J < ./lib/digest-wrapper.js > $NM/lib/digest-wrapper.js 
$J < ./lib/noop.js > $NM/lib/noop.js 
$J < ./lib/passthrough-wrapper.js > $NM/lib/passthrough-wrapper.js 

$J < $S/mldb-jquery.js > $DJ/mldb-jquery.js 
$J < $S/mldb-prototype.js > $DJ/mldb-prototype.js 
$J < $S/mldb-xhr.js > $DJ/mldb-xhr.js 
$J < $S/mldb-xhr2.js > $DJ/mldb-xhr2.js 

$J < $S/highcharts.js > $DJ/highcharts.js 
$J < $S/widget-collections.js > $DJ/widget-collections.js 
$J < $S/widget-cooccurence.js > $DJ/widget-cooccurence.js 
$J < $S/widget-dls.js > $DJ/widget-dls.js 
$J < $S/widget-docbuilder.js > $DJ/widget-docbuilder.js 
$J < $S/widget-highcharts.js > $DJ/widget-highcharts.js 
$J < $S/widget-kratu.js > $DJ/widget-kratu.js 
$J < $S/widget-markings.js > $DJ/widget-markings.js 
$J < $S/widget-search.js > $DJ/widget-search.js 
$J < $S/widgets.js > $DJ/widgets.js 

cp $S/widgets.css $D/css/widgets.css
cp $S/widgets.css $R/css/widgets.css

# tests
cp $S/page*.js $R/test/
cp $S/page*.js $D/test/

# docs
cp browser.md $D/README.md
cp browser.md $R/README.md
cp core.md $N/README.md
cp core.md $NM/README.md

# jsdocs
./gendocs.sh

# zips and tars
tar czf ./dist/mldb-browser.tar.gz $R
tar czf ./dist/mldb-browser-minified.tar.gz $D
tar czf ./dist/mldb-nodejs.tar.gz $N
tar czf ./dist/mldb-nodejs-minified.tar.gz $NM
zip -vr ./dist/mldb-browser.zip $R
zip -vr ./dist/mldb-browser-minified.zip $D
zip -vr ./dist/mldb-nodejs.zip $N
zip -vr ./dist/mldb-nodejs-minified.zip $NM

tar czf ./dist/mldb-docs.tar.gz ./dist/docs
zip -vr ./dist/mldb-docs.zip ./dist/docs

# cleanup
rm -rf dist/mldb
rm -rf dist/docs

echo "Done."
exit 0 
