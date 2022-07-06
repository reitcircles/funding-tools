#!/bin/sh

APP_NAME="calc-reward"
APP_ZONE="europe-west1"

if [ $# -eq 0 ]
then
    echo "No arguments supplied. Need a project in gcp to which this app will be deployed"
    exit 0
else
    PROJECT_ID=$1
    gcloud config set project $PROJECT_ID
    gcloud config set compute/zone $APP_ZONE
    gcloud run deploy $APP_NAME --allow-unauthenticated    
fi

