#!/usr/bin/env node

require('dotenv').config()
const axios = require("axios")
const _ = require("lodash")
const db = require("./db")


let service = axios.create({
    baseURL: `${process.env.BASEURL}`,
    responseType: "json",
    headers: {
	project_id: process.env.PROJECT_ID
    }
});

class PoolData {
    constructor(){
	console.log(process.env) // remove this after you've confirmed it working
    }

    async find_latest_epoch(){
	var URL =  `/epochs/latest`
	try{
	    var response = await service.get(URL)
	    console.log(`statusCode: ${response.status}`)
	    return parseInt(response.data.epoch)
	}
	catch(error){
            console.error(error)
        }
    }    

    async find_num_delegators(poolID){
	var URL = `/pools/${poolID}`
	try{
	    var response = await service.get(URL)
	    console.log(`statusCode: ${response.status}`)
	    return response.data.live_delegators	    
	}
	catch(error){
            console.error(error)
        }
    }
        
    //Fetch the stakes of a certain stake pool for a single epoch
    async fetch_stakes(epoch_array,poolID) {
	var stake_value = 0
	var num_pages = Math.floor(await this.find_num_delegators(poolID)/100) + 1
	var found = false

	try{

	    epoch_array.map(async epoch => {

		for (let page_id=1; (page_id<num_pages) && (stake_value == 0); page_id++){
		    
		    var URL = `/epochs/${epoch}/stakes/${poolID}`
		    var params = {
			params: {
			    page: page_id,
			}
		    }
		    var response = await service.get(URL, params)		
		    //console.log(`statusCode: ${response.status}`)

		    response.data.map((x,index) => {
			//since we are going through each element, just store them in our database
			db.StakePool.create({
	    		    poolid: poolID,
	    		    epoch: epoch,
	    		    stakeAddr: x.stake_address,
	    		    Amount: x.amount
			})	    
		    })
		}		
	    })
	    
	    return 0	    
	}
	
	catch(error){
	    console.error(error)
	}	    
    }

    
    async fetch_pool_history(epoch_array, poolID){
	try{
	    var URL=`/pools/${poolID}/history`
	    var params = {
		params: {
		    order: 'desc',
		}
	    }
	    console.log(`now calling ${URL}`)
	    var response = await service.get(URL, params)
	    console.log(`statusCode: ${response.status}`)
	    console.log(response.data)

	    //Now send this data to our database
	    response.data.map(data => {
		if (epoch_array.includes(data.epoch)) {
		    db.PoolHistory.create({
			poolid: poolID,
			epoch: data.epoch,
			activeStake: data.active_stake,
			activeSize: data.active_size,
			rewards: data.rewards                   
		    });
		    
		}
	    })	    	    
	}
	catch(error){
	    console.error(error)
	}
    }
    
    async fetch_sp_data(){
	try{
	    var poolID = process.env.POOLID	
	    var end_epoch   = await this.find_latest_epoch()-1
	    var start_epoch = end_epoch - 36
	    var epoch_array = _.range(start_epoch, end_epoch)
	    	    
	    console.log(epoch_array)	    
	    //Now import all the data for the epoch delegation into our db
	    await this.fetch_stakes(epoch_array, poolID)
	    await this.fetch_pool_history(epoch_array, poolID)
	}
	catch(error){
	    console.log(error)
	}	   

    }


    async connect_db(initialize){
	try{
	    await db.sequelize.authenticate();
	    console.log('Connection has been established successfully.');
	    if (initialize){
		await db.StakePool.sync({ force: true });
		console.log("The table for the StakePool model was just (re)created!");

		await db.PoolHistory.sync({force: true})
		console.log("The table for the Poolhistory model was just (re)created!");
		
		
	    }			    
	}
	catch(error){
	    console.log(error)
	}	   
	

    }
    
}

if (require.main === module){
    (async() => {
	
	var r = new PoolData()
	
	//Be careful of this. It resets the Database.
	var init = true
	
	//Connect to db
	await r.connect_db(init)
	
	//Fetch data from blockfrost to custom db
	await r.fetch_sp_data()
	
    })()
}
    
