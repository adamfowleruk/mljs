#!/bin/sh
./cpjs.sh

echo "In update rest..."

cd apps

mkdir -p mljsrest/src/app/models
mkdir -p mljsrest/src/roxy/config

cd ..

SRC=./src
CS=./src/css
S=./src/js
SA=./apps/mldbwebtest/src
SJ=./apps/mldbwebtest/src/public/js
RA=./apps/mljsrest/src
RJ=./apps/mljsrest/src/js
WA=./apps/workplace/src
WJ=$WA/js

mkdir -p $WA/js/mljs
mkdir -p $WA/js/lib
mkdir -p $WA/css/mljs
mkdir -p $WA/images/mljs
mkdir -p ./apps/workplace/rest-api/ext
mkdir -p $WA/app/models
mkdir -p $WA/app/config
mkdir -p $WA/roxy/config

cp $S/*.js $SJ/mljs/
cp $SRC/images/* $SA/public/images/mljs/
cp $SRC/css/* $SA/public/css/mljs/
cp $S/*.js $RJ/mljs/
cp $SRC/images/* $RA/images/mljs/
cp $SRC/css/* $RA/css/mljs/
cp $S/*.js $WJ/mljs/
cp $SRC/images/* $WA/images/mljs/
cp $SRC/css/* $WA/css/mljs/

# Copy over page JS files - MLJSTEST IS PRIMARY
cp $RJ/mljstest/*.js $SJ/mljstest/

#cd apps

# other dependencies now
cp -R $RA/js/OpenLayers-2.13.1 $SA/public/js
cp -R $RA/js/dataproviders $SA/public/js
cp -R $RA/js/heatmap $SA/public/js
cp $RA/js/highcharts.js $SA/public/js/
cp $RA/js/kratu.js $SA/public/js/
cp $RA/js/kratuSignalAdjustments.js $SA/public/js/
cp $RA/js/lib/jquery-1.7.1.min.js $SA/public/js/lib/

#copy once, never again
#cp mldbwebtest/src/public/css/one-column.less mljsrest/src/css/one-column.css
#cp mldbwebtest/src/public/css/vars.less mljsrest/src/css/vars.css
cp $RA/css/bootstrap-roxy.css $SA/public/css/bootstrap-roxy.css
cp $RA/css/kratu.css $SA/public/css/kratu.css
#cp mldbwebtest/src/public/css/reset.css mljsrest/src/css/reset.css
cp -R $RA/css/960 $SA/public/css/
cp apps/mljsrest/rest-api/ext/* apps/mldbwebtest/rest-api/ext/
cp $RA/app/models/rdb2rdf-lib.xqy $SA/app/models/
cp $RA/app/models/lib-thesaurus.xqy $SA/app/models/
cp $RA/app/config/config.xqy $SA/app/config/
cp $RA/roxy/config/defaults.xqy $SA/roxy/config/
cp $RA/app/models/sql.xqy $SA/app/models/

#Now workplace app copies
# other dependencies now
cp -R $RA/js/OpenLayers-2.13.1 $WA/js
cp -R $RA/js/dataproviders $WA/js
cp -R $RA/js/heatmap $WA/js
cp $RA/js/highcharts.js $WA/js/
cp $RA/js/kratu.js $WA/js/
cp $RA/js/kratuSignalAdjustments.js $WA/js/
cp $RA/js/lib/jquery-1.7.1.min.js $WA/js/lib/

#copy once, never again
#cp mldbwebtest/src/public/css/one-column.less mljsrest/src/css/one-column.css
#cp mldbwebtest/src/public/css/vars.less mljsrest/src/css/vars.css
#cp $RA/css/bootstrap-roxy.css $WA/css/bootstrap-roxy.css
cp $RA/css/kratu.css $WA/css/kratu.css
cp $RA/css/bootstrap* $WA/css/
cp $RA/js/bootstrap* $WA/js/
#cp mldbwebtest/src/public/css/reset.css mljsrest/src/css/reset.css
#cp -R $RA/css/960 $SA/css/
cp apps/mljsrest/rest-api/ext/* apps/workplace/rest-api/ext/
cp $RA/app/models/rdb2rdf-lib.xqy $WA/app/models/
cp $RA/app/models/lib-thesaurus.xqy $WA/app/models/
#cp $RA/app/config/config.xqy $WA/app/config/
#cp $RA/roxy/config/defaults.xqy $WA/roxy/config/
cp $RA/app/models/sql.xqy $WA/app/models/
cp -R $RA/fonts $WA


#cd ..

echo "Done."
exit 0
