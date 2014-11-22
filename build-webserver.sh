#!/bin/sh

echo "---------------------"
echo "Starting build of $1"

# $1 = app name
D=./dist/app-$1
rm -rf $D

mkdir $D
mkdir $D/src
mkdir $D/rest-api
mkdir $D/example-workplaces

cp ./webserver/* $D/
echo "Copying src"
cp -R ./apps/$1/src/* $D/src/
echo "Copying rest-api"
cp -R ./apps/$1/rest-api/* $D/rest-api/
echo "Copying workplaces"
cp -R ./apps/$1/example-workplaces/* $D/example-workplaces/
echo "Copying package.json"
cp ./apps/$1/package.json $D/
echo "Copying bower.json"
cp ./apps/$1/bower.json $D/

# Now copy final files in to Yeoman generator
BASE=../generator-mljs$1
echo "gen base: $BASE"
rm -rf $BASE/app/templates/files/*
cp -R $D/* $BASE/app/templates/files/

cd dist
tar czf ./app-$1.tar.gz app-$1
cd ..

rm -rf $D

echo "Completed build of $1"
echo "---------------------"
exit 0
