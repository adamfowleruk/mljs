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
mkdir dist/mljs/browser-raw/mljstest
mkdir dist/mljs/browser-raw/roxy
mkdir dist/mljs/browser-raw/roxy/app
mkdir dist/mljs/browser-raw/roxy/app/controllers
mkdir dist/mljs/browser-raw/roxy/app/views
mkdir dist/mljs/browser-raw/roxy/app/views/mljstest
mkdir dist/mljs/browser-raw/roxy/app/views/layouts
mkdir dist/mljs/browser-raw/roxy/public
mkdir dist/mljs/browser-raw/roxy/public/css
mkdir dist/mljs/browser-raw/roxy/public/css/mljs
mkdir dist/mljs/browser-raw/roxy/public/js
mkdir dist/mljs/browser-raw/roxy/public/js/mljs
mkdir dist/mljs/browser-raw/roxy/public/js/mljstest
mkdir dist/mljs/nodejs-minified
mkdir dist/mljs/nodejs-minified/lib
mkdir dist/mljs/browser-minified
mkdir dist/mljs/browser-minified/js
mkdir dist/mljs/browser-minified/css
mkdir dist/mljs/browser-minified/images
mkdir dist/mljs/browser-minified/mljstest
mkdir dist/mljs/browser-minified/roxy
mkdir dist/mljs/browser-minified/roxy/app
mkdir dist/mljs/browser-minified/roxy/app/controllers
mkdir dist/mljs/browser-minified/roxy/app/views
mkdir dist/mljs/browser-minified/roxy/app/views/mljstest
mkdir dist/mljs/browser-minified/roxy/app/views/layouts
mkdir dist/mljs/browser-minified/roxy/public
mkdir dist/mljs/browser-minified/roxy/public/css
mkdir dist/mljs/browser-minified/roxy/public/css/mljs
mkdir dist/mljs/browser-minified/roxy/public/js
mkdir dist/mljs/browser-minified/roxy/public/js/mljs
mkdir dist/mljs/browser-minified/roxy/public/js/mljstest

P=../mljs-pages/apidocs
SRC=./mldbwebtest/src
CS=./mldbwebtest/src/public/css/mljs
S=./mldbwebtest/src/public/js/mljs
SJ=./mldbwebtest/src/public/js
ST=./mldbwebtest/src/public/js/mljstest
L=./lib
D=./dist/mljs/browser-minified
DJ=$D/js
N=./dist/mljs/nodejs-raw
NM=./dist/mljs/nodejs-minified
R=./dist/mljs/browser-raw
RJ=$R/js
J=./build-lib/jsmin

./cpjs.sh

./updaterest.sh

cp $L/*.js $N/lib/
cp mljs.js $RJ/
cp mljs.js $N/
cp $S/mljs-*.js $RJ/
cp $S/widget*.js $RJ/
cp $SJ/highcharts.js $RJ/

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

$J < $SJ/highcharts.js > $DJ/highcharts.js 
$J < $S/widget-collections.js > $DJ/widget-collections.js 
$J < $S/widget-cooccurence.js > $DJ/widget-cooccurence.js 
$J < $S/widget-dls.js > $DJ/widget-dls.js 
$J < $S/widget-docbuilder.js > $DJ/widget-docbuilder.js 
$J < $S/widget-documents.js > $DJ/widget-documents.js 
$J < $S/widget-explore.js > $DJ/widget-explore.js 
$J < $S/widget-highcharts.js > $DJ/widget-highcharts.js 
$J < $S/widget-kratu.js > $DJ/widget-kratu.js 
$J < $S/widget-markings.js > $DJ/widget-markings.js 
$J < $S/widget-openlayers.js > $DJ/widget-openlayers.js 
$J < $S/widget-profile.js > $DJ/widget-profile.js 
$J < $S/widget-rdb2rdf.js > $DJ/widget-rdb2rdf.js 
$J < $S/widget-search.js > $DJ/widget-search.js 
$J < $S/widget-triples.js > $DJ/widget-triples.js 
$J < $S/widget-workplace.js > $DJ/widget-workplace.js 
$J < $S/widgets.js > $DJ/widgets.js 

cp $CS/widgets.css $D/css/widgets.css
cp $CS/widgets.css $R/css/widgets.css

# tests
cp $ST/page*.js $R/mljstest/
cp $ST/page*.js $D/mljstest/

# Roxy controller, layout, etc.
# NB non minified versions are copied for Roxy code - for ease of debugging on reported issues.
cp $SRC/app/controllers/mljstest.xqy $R/roxy/app/controllers/
cp $SRC/app/views/mljstest/* $R/roxy/app/views/mljstest/
cp $SRC/app/views/layouts/mljs-* $R/roxy/app/views/layouts/
cp $SRC/public/css/one-column.less $R/roxy/public/css/
cp $SRC/public/css/bootstrap-roxy.css $R/roxy/public/css/
cp -R $SRC/public/css/960 $R/roxy/public/css/960
cp $SRC/public/css/mljs/* $R/roxy/public/css/mljs/
cp $SRC/public/js/mljs/* $R/roxy/public/js/mljs/
cp $SRC/public/js/mljstest/* $R/roxy/public/js/mljstest/
cp $SRC/public/js/highcharts.js $R/roxy/public/js/
cp $SRC/public/js/kratu*.js $R/roxy/public/js/
cp -R $SRC/public/js/dataproviders $R/roxy/public/js/
cp -R $SRC/public/js/OpenLayers-2.13.1 $R/roxy/public/js/
cp -R $SRC/public/js/heatmap $R/roxy/public/js/

cp $SRC/app/controllers/mljstest.xqy $D/roxy/app/controllers/
cp $SRC/app/views/mljstest/* $D/roxy/app/views/mljstest/
cp $SRC/app/views/layouts/mljs-* $D/roxy/app/views/layouts/
cp $SRC/public/css/one-column.less $D/roxy/public/css/
cp $SRC/public/css/bootstrap-roxy.css $D/roxy/public/css/
cp -R $SRC/public/css/960 $D/roxy/public/css/960
cp $SRC/public/css/mljs/* $D/roxy/public/css/mljs/
cp $SRC/public/js/mljs/* $D/roxy/public/js/mljs/
cp $SRC/public/js/mljstest/* $D/roxy/public/js/mljstest/
cp $SRC/public/js/highcharts.js $D/roxy/public/js/
cp $SRC/public/js/kratu*.js $D/roxy/public/js/
cp -R $SRC/public/js/dataproviders $D/roxy/public/js/
cp -R $SRC/public/js/OpenLayers-2.13.1 $D/roxy/public/js/
cp -R $SRC/public/js/heatmap $D/roxy/public/js/

# docs
cp browser.md $D/README.md
cp browser.md $R/README.md
cp core.md $N/README.md
cp core.md $NM/README.md

# jsdocs
# disabled when in one of the dev branches
./gendocs.sh
tar czf ./dist/mljs-docs.tar.gz ./dist/docs
zip -vr ./dist/mljs-docs.zip ./dist/docs
rm -rf dist/docs

# zips and tars
tar czf ./dist/mljs-browser.tar.gz $R
tar czf ./dist/mljs-browser-minified.tar.gz $D
tar czf ./dist/mljs-nodejs.tar.gz $N
tar czf ./dist/mljs-nodejs-minified.tar.gz $NM
zip -vr ./dist/mljs-browser.zip $R
zip -vr ./dist/mljs-browser-minified.zip $D
zip -vr ./dist/mljs-nodejs.zip $N
zip -vr ./dist/mljs-nodejs-minified.zip $NM


# cleanup
rm -rf dist/mljs

echo "Done."
exit 0 
