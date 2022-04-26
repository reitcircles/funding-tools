#!/usr/bin/env node

require('dotenv').config()
const axios = require("axios")


class Rewards{
    constructor(stakeID){
	this.stakeID = stakeID
	console.log(process.env) // remove this after you've confirmed it working
    }


    async find_num_delegators(){
	var URL = `${process.env.BASEURL}/pools/${poolID}`
	try{
	    var response = await axios.get(URL)
	    console.log(`statusCode: ${response.status}`)
	    console.log(response)
	    return response.live_delegators	    
	}
	catch(error => {
            console.error(error)
        })
    }

    //now search in this array if stakeID is present
    find_stake_amount(t_arr){
	const stake_value = 0
	stake_arr = t_arr.map(x => {
	    return x.stake_address
	})
	if stake_arr.includes(this.stakeID){
	    stake_posn = stake_arr.indexOf(this.stakeID)
	    stake_value = t_arr[stake_posn].amount
	}
	return stake_value	
    }
    
    
    //Fetch the stakes for all epochs for a certain stake pool
    async fetch_stakes(epoch,poolID){
	page_id=0
	num_pages = Math.floor(await this.find_num_delegators()) + 1
	found = false

	for (page_id=0;(page_id<num_pages) && !found;page_id++){
	    
	    var URL = `${process.env.BASEURL}/epochs/${epoch}/stakes/${poolID}?page=${page_id}`
	    axios
		.get(URL)
		.then(res => {
		    console.log(`statusCode: ${res.status}`)		    		    
		    stake_value = this.find_stake_amount(res)
		    console.log(`Found stake value:${stake_value} for address:${this.stakeID}`)
		    console.log(res)
		})
		.catch(error => {
		    console.error(error)
		})	    
	}
    }
}
