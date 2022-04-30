#!/usr/bin/env node

/*Sequence of actions:
   - Identify stake addresses for the stake pool
   - Identify payment address corresponding to the stakes addresses.
   - map { payment_addr: "", rewards:""}
   - Trigger payment via script to each of the above addresses using cardano-cli

*/


const cr = require("./calc_rewards")
const poolID = process.env.poolID


class Airdrop{
    constructor(){
	
    }

    identify_stake_addresses(poolID){
	const URL = `/pools/${poolID}/delegators`
	try{
	    var response = await cr.service.get(URL)
	    console.log(`statusCode: ${response.status}`)
	    return response.data
	}
	catch(error){
            console.error(error)
        }	
    }

    fetch_payment_addr(stake_address){
	const URL=`/accounts/${stake_address}/addresses`
	try{
	    var response = await cr.service.get(URL)
	    console.log(`statusCode: ${response.status}`)
	    return response.data
	}
	catch(err){
	    
	}
    }

    map_stake_to_rewards(){
	const stake_addresses = this.identify_stake_addresses(poolID)

	cr.dbConnect(false)
	
	var rewards_array = stake_addresses.map(stakeAddr => {

	    let p = this.fetch_payment_addr(stakeAddr)
	    let payment_addr = p[0]["address"]
	    
	    let R = new cr.Rewards(stakeAddr)	  
	    let reward = await R.calculate_base_reward([332,333])
	    reward["stakeAddr"] = stakeAddr
	    reward["paymentAddr"] = payment_addr
	    return reward
	    
	})
    }

    //Here we will trigger payment by iterating over reward array.
    enable_payment(reward_array){
	
    }
}
