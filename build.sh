#!/bin/sh

rm -rf dist
mkdir dist
mkdir dist/mljs
mkdir dist/mljs/nodejs-raw
mkdir dist/mljs/nodejs-raw/lib
mkdir dist/mljs/browser-raw
mkdir dist/mljs/browser-raw/js
mkdir dist/mljs/browser-raw/css
mkdir dist/mljs/browser-raw/images
mkdir dist/mljs/browser-raw/test
mkdir dist/mljs/nodejs-minified
mkdir dist/mljs/nodejs-minified/lib
mkdir dist/mljs/browser-minified
mkdir dist/mljs/browser-minified/js
mkdir dist/mljs/browser-minified/css
mkdir dist/mljs/browser-minified/images
mkdir dist/mljs/browser-minified/test

P=../mljs-pages/apidocs
S=./mldbwebtest/src/public/js/mldbtest
L=./lib
D=./dist/mljs/browser-minified
DJ=$D/js
N=./dist/mljs/nodejs-raw
NM=./dist/mljs/nodejs-minified
R=./dist/mljs/browser-raw
RJ=$R/js
J=./build-lib/jsmin

./cpjs.sh

cp $L/*.js $N/lib/
cp mljs.js $RJ/
cp mljs.js $N/
cp $S/mljs-*.js $RJ/
cp $S/widget*.js $RJ/
cp $S/highcharts.js $RJ/

$J < $S/mljs.js > $DJ/mljs.js
cp $DJ/mljs.js $NM/
$J < ./lib/basic-wrapper.js > $NM/lib/basic-wrapper.js 
$J < ./lib/digest-wrapper.js > $NM/lib/digest-wrapper.js 
$J < ./lib/noop.js > $NM/lib/noop.js 
$J < ./lib/passthrough-wrapper.js > $NM/lib/passthrough-wrapper.js 

$J < $S/mljs-jquery.js > $DJ/mljs-jquery.js 
$J < $S/mljs-prototype.js > $DJ/mljs-prototype.js 
$J < $S/mljs-xhr.js > $DJ/mljs-xhr.js 
$J < $S/mljs-xhr2.js > $DJ/mljs-xhr2.js 

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
tar czf ./dist/mljs-browser.tar.gz $R
tar czf ./dist/mljs-browser-minified.tar.gz $D
tar czf ./dist/mljs-nodejs.tar.gz $N
tar czf ./dist/mljs-nodejs-minified.tar.gz $NM
zip -vr ./dist/mljs-browser.zip $R
zip -vr ./dist/mljs-browser-minified.zip $D
zip -vr ./dist/mljs-nodejs.zip $N
zip -vr ./dist/mljs-nodejs-minified.zip $NM

tar czf ./dist/mljs-docs.tar.gz ./dist/docs
zip -vr ./dist/mljs-docs.zip ./dist/docs

# cleanup
rm -rf dist/mljs
rm -rf dist/docs

echo "Done."
exit 0 
