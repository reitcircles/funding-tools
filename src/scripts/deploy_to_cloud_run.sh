#!/bin/bash

#The pre-requisite to run this file: .env containing the environment variables.

PARAM_STRING=""

for i in `cat .env`; do PARAM_STRING=$PARAM_STRING "--set-env-vars $i"; done

gcloud run deploy 
