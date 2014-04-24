#!/bin/sh
./cpjs.sh

echo "In update rest..."

cd apps

mkdir mljsrest/src/app
mkdir mljsrest/src/app/models
mkdir mljsrest/src/roxy
mkdir mljsrest/src/roxy/config

cd ..

SRC=./src
CS=./src/css
S=./src/js
SA=./apps/mldbwebtest/src
SJ=./apps/mldbwebtest/src/public/js
RA=./apps/mljsrest/src
RJ=./apps/mljsrest/src/js


cp $S/*.js $SJ/mljs/
cp $SRC/images/* $SA/public/images/mljs/
cp $SRC/css/* $SA/public/css/mljs/
cp $S/*.js $RJ/mljs/
cp $SRC/images/* $RA/images/mljs/
cp $SRC/css/* $RA/css/mljs/

# Copy over page JS files - MLJSTEST IS PRIMARY
cp $RJ/mljstest/*.js $SJ/mljstest/

cd apps

# other dependencies now
cp -R mldbwebtest/src/public/js/OpenLayers-2.13.1 mljsrest/src/js
cp -R mldbwebtest/src/public/js/dataproviders mljsrest/src/js
cp -R mldbwebtest/src/public/js/heatmap mljsrest/src/js
cp mldbwebtest/src/public/js/highcharts.js mljsrest/src/js/
cp mldbwebtest/src/public/js/kratu.js mljsrest/src/js/
cp mldbwebtest/src/public/js/kratuSignalAdjustments.js mljsrest/src/js/

cp mldbwebtest/src/public/js/lib/jquery-1.7.1.min.js mljsrest/src/js/lib/

#copy once, never again
#cp mldbwebtest/src/public/css/one-column.less mljsrest/src/css/one-column.css
#cp mldbwebtest/src/public/css/vars.less mljsrest/src/css/vars.css
cp mldbwebtest/src/public/css/bootstrap-roxy.css mljsrest/src/css/bootstrap-roxy.css
cp mldbwebtest/src/public/css/kratu.css mljsrest/src/css/kratu.css
#cp mldbwebtest/src/public/css/reset.css mljsrest/src/css/reset.css

cp -R mldbwebtest/src/public/css/960 mljsrest/src/css/

cp mldbwebtest/rest-api/ext/* mljsrest/rest-api/ext/


cp mldbwebtest/src/app/models/rdb2rdf-lib.xqy mljsrest/src/app/models/
cp mldbwebtest/src/app/models/lib-thesaurus.xqy mljsrest/src/app/models/
cp mldbwebtest/src/app/config/config.xqy mljsrest/src/app/config/
cp mldbwebtest/src/roxy/config/defaults.xqy mljsrest/src/roxy/config/
cp mldbwebtest/src/app/models/sql.xqy mljsrest/src/app/models/

cd ..

echo "Done."
exit 0
