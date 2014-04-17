#!/bin/sh
./cpjs.sh

cd apps

mkdir mljsrest/src/app
mkdir mljsrest/src/app/models
mkdir mljsrest/src/roxy
mkdir mljsrest/src/roxy/config


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
