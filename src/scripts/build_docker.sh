#!/bin/sh

BASEURL='${{ secrets.BASEURL }}'
POOLID='${{ secrets.POOLID }}'
BEGIN_EPOCH='${{ secrets.BEGIN_EPOCH }}'
REWARD_FACTOR='${{ secrets.REWARD_EPOCH }}'
TOTAL_EXTRA_REWARD='${{ secrets.TOTAL_EXTRA_REWARD }}'
REGION_A_WEIGHT='${{ secrets.REGION_A_WEIGHT }}'
REGION_B_WEIGHT='${{ secrets.REGION_B_WEIGHT }}'
REGION_C_WEIGHT='${{ secrets.REGION_C_WEIGHT }}'
STAKE_THRESH_1='${{ secrets.STAKE_THRESH_1 }}'
STAKE_THRESH_2='${{ secrets.STAKE_THRESH_2 }}'
STAKE_THRESH_3='${{ secrets.STAKE_THRESH_3 }}'
PROJECT_ID='${{ secrets.PROJECT_ID }}'
MYSQL_USERNAME='${{ secrets.MYSQL_USERNAME }}'
MYSQL_PASSWORD='${{ secrets.MYSQL_PASSWORD }}'
MYSQL_DATABASE='${{ secrets.MYSQL_DATABASE }}'
MYSQL_HOSTNAME='${{ secrets.MYSQL_HOSTNAME }}'

--dict-flag=key1=value1,key2=value2

COMMAND='gcloud builds submit --tag us-west2-docker.pkg.dev/sproj-346921/quickstart-docker-repo/funding-srv --pack=[env=] .'
