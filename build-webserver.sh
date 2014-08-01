#!/bin/sh

echo "---------------------"
echo "Starting build of $1"

# $1 = app name
D=./dist/app-$1
rm -rf $D

mkdir $D
mkdir $D/src

cp ./webserver/* $D/
cp -R ./apps/$1/src/* $D/src/

tar czf ./dist/app-$1.tar.gz $D

rm -rf $D

echo "Completed build of $1"
echo "---------------------"
exit 0
