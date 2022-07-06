#!/bin/sh

APP_URL=$1


if [ $# -eq 0 ]
then
    echo "No arguments supplied. Need the APP URL in gcp"
    exit 0
else
    
    curl -I -X OPTIONS \
         -H "Origin: https://www.reitcircles.com" \
         -H "Access-Control-Request-Method: GET" \
         -v $APP_URL 
    
fi

