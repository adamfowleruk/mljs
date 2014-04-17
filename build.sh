#!/bin/sh

rm -rf dist
mkdir dist
mkdir dist/mljs/node-dev
mkdir dist/mljs/node-prod
mkdir dist/mljs/node-dev/lib
mkdir dist/mljs/node-prod/lib
mkdir dist/mljs/browser-dev
mkdir dist/mljs/browser-dev/js
mkdir dist/mljs/browser-dev/css
mkdir dist/mljs/browser-dev/images
mkdir dist/mljs/browser-prod
mkdir dist/mljs/browser-prod/js
mkdir dist/mljs/browser-prod/css
mkdir dist/mljs/browser-prod/images

P=../mljs-pages/apidocs
SRC=./src
CS=./src/css
S=./src/js
SA=./apps/mldbwebtest/src
SJ=./apps/mldbwebtest/src/public/js
L=./src/lib
D=./dist/browser-prod
DJ=$D/js
N=./dist/node-dev
NM=./dist/node-prod
R=./dist/browser-dev
RJ=$R/js
J=./build-lib/jsmin

./cpjs.sh

./updaterest.sh

cp $L/*.js $N/lib/
cp $S/mljs.js $RJ/
cp $S/mljs.js $N/
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
$J < $S/widget-address.js > $DJ/widget-address.js
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
$J < $S/widget-tagcloud.js > $DJ/widget-tagcloud.js
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
#cp $SRC/app/controllers/mljstest.xqy $R/roxy/app/controllers/
#cp $SRC/app/views/mljstest/* $R/roxy/app/views/mljstest/
#cp $SRC/app/views/layouts/mljs-* $R/roxy/app/views/layouts/
#cp $SRC/public/css/one-column.less $R/roxy/public/css/
cp $SA/public/css/bootstrap-roxy.css $R/css/
cp -R $SRC/public/css/960 $R/css/960
#cp $SA/css/* $R/css/
#cp $SA/js/* $R/js/
#cp $SA/images/* $R/images/
#cp $SRC/public/js/mljstest/* $R/roxy/public/js/mljstest/
cp $SA/public/js/highcharts.js $R/js/
cp $SA/public/js/kratu*.js $R/js/
cp -R $SA/public/js/dataproviders $R/js/
cp -R $SA/public/js/OpenLayers-2.13.1 $R/js/
cp -R $SA/public/js/heatmap $R/js/


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
tar czf ./dist/mljs-browser-dev.tar.gz $R
tar czf ./dist/mljs-browser-prod.tar.gz $D
tar czf ./dist/mljs-node-dev.tar.gz $N
tar czf ./dist/mljs-node-prod.tar.gz $NM
zip -vr ./dist/mljs-browser-dev.zip $R
zip -vr ./dist/mljs-browser-prod.zip $D
zip -vr ./dist/mljs-node-dev.zip $N
zip -vr ./dist/mljs-nodejs-prod.zip $NM


# cleanup
#rm -rf dist/mljs

echo "Done."
exit 0
