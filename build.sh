#!/bin/sh

rm -rf dist
mkdir dist
mkdir dist/node-dev
mkdir dist/node-prod
mkdir dist/node-dev/lib
mkdir dist/node-prod/lib
mkdir dist/browser-dev
mkdir dist/browser-dev/js
mkdir dist/browser-dev/css
mkdir dist/browser-dev/images
mkdir dist/browser-prod
mkdir dist/browser-prod/js
mkdir dist/browser-prod/css
mkdir dist/browser-prod/images

P=../mljs-pages/apidocs
SRC=./src
CS=./src/css
S=./src/js
SA=./apps/mldbwebtest/src
SJ=./apps/mldbwebtest/src/public/js
L=./src/js/lib
D=./dist/browser-prod
DJ=$D/js
N=./dist/node-dev
NM=./dist/node-prod
R=./dist/browser-dev
RJ=$R/js
J=./build-lib/jsmin

#./cpjs.sh

./updaterest.sh

cp $L/*.js $N/lib/
cp $S/mljs.js $RJ/
cp $S/mljs.js $N/
cp $SRC/images/* $R/images/
cp $SRC/images/* $D/images/
cp $S/mljs-*.js $RJ/
cp $S/widget*.js $RJ/
cp $SJ/highcharts.js $RJ/

$J < $S/mljs.js > $DJ/mljs.js
cp $DJ/mljs.js $NM/
$J < ./src/js/lib/basic-wrapper.js > $NM/lib/basic-wrapper.js
$J < ./src/js/lib/digest-wrapper.js > $NM/lib/digest-wrapper.js
$J < ./src/js/lib/noop.js > $NM/lib/noop.js
$J < ./src/js/lib/passthrough-wrapper.js > $NM/lib/passthrough-wrapper.js

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

cp $CS/*.css $D/css/
cp $CS/*.css $R/css/

# tests
#cp $ST/page*.js $R/mljstest/
#cp $ST/page*.js $D/mljstest/

# Roxy controller, layout, etc.
# NB non minified versions are copied for Roxy code - for ease of debugging on reported issues.
#cp $SRC/app/controllers/mljstest.xqy $R/roxy/app/controllers/
#cp $SRC/app/views/mljstest/* $R/roxy/app/views/mljstest/
#cp $SRC/app/views/layouts/mljs-* $R/roxy/app/views/layouts/
#cp $SRC/public/css/one-column.less $R/roxy/public/css/
cp $SA/public/css/bootstrap-roxy.css $R/css/
cp -R $SA/public/css/960 $R/css/960
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

# Create bower output
cp -R ./dist/browser-prod/* ../mljs-bower/

./build-webserver.sh workplace
./build-webserver.sh mljsrest

# copy over mljs node scripts to dist
mkdir ../mlnodetools/src
mkdir ../mlnodetools/src/util
mkdir ../mlnodetools/src/config
mkdir ../mlnodetools/src/packages
mkdir ../mlnodetools/src/packages/databases
mkdir ../mlnodetools/src/data
mkdir ../mlnodetools/src/modules
mkdir ../mlnodetools/src/app
mkdir ../mlnodetools/dist
cp webserver/mljsadmin ../mlnodetools/src/
cp webserver/mljsserve ../mlnodetools/src/
cp webserver/mljsadmin.bat ../mlnodetools/src/
cp webserver/mljsserve.bat ../mlnodetools/src/
cp webserver/package.json ../mlnodetools/src/
cp webserver/util/* ../mlnodetools/src/util/
cp webserver/config/* ../mlnodetools/src/config/

# cleanup
#rm -rf dist/mljs

echo "Done."
exit 0
