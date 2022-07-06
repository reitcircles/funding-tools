#!/bin/sh

SERVICE_NAME='calc-reward'
EMAIL='802424927871@cloudbuild.gserviceaccount.com'

gcloud run services add-iam-policy-binding SERVICE_NAME \
  --member=user:EMAIL \
  --role=roles/run.invoker
