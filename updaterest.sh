#!/bin/sh
./cpjs.sh 

mkdir mljsrest/src/js
mkdir mljsrest/src/js/lib
mkdir mljsrest/src/js/mljs
mkdir mljsrest/src/js/mljstest
mkdir mljsrest/src/css
mkdir mljsrest/src/css/mljs
mkdir mljsrest/src/images
mkdir mljsrest/src/images/mljs
mkdir mljsrest/src/app
mkdir mljsrest/src/app/models
mkdir mljsrest/src/roxy
mkdir mljsrest/src/roxy/config

cp -R mldbwebtest/src/public/js/mljs mljsrest/src/js
cp -R mldbwebtest/src/public/js/mljstest mljsrest/src/js
cp -R mldbwebtest/src/public/css/mljs mljsrest/src/css
cp -R mldbwebtest/src/public/images/mljs mljsrest/src/images

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
cp mldbwebtest/src/app/config/config.xqy mljsrest/src/app/config/
cp mldbwebtest/src/roxy/config/defaults.xqy mljsrest/src/roxy/config/
cp mldbwebtest/src/app/models/sql.xqy mljsrest/src/app/models/

echo "Done."
exit 0
