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

let dbConnect =  async (initialize) => {
	try{
	    await db.sequelize.authenticate();
	    console.log('Connection has been established successfully.');
	    if (initialize){
		await db.StakePool.sync({ force: true });
		console.log("The table for the StakePool model was just (re)created!");
	    }			    
	}
	catch(err){
	    console.log(err)
	}

}


class Rewards{
    constructor(stakeAddr){
	this.saddr = stakeAddr
	this.rewardFactor = 0.19
	this.maxDelegation = 64*Math.pow(10,12)//in lovelace
	this.startEpoch = 332
	this.total_extra_rewards = 0.18*Math.pow(10,9)	
    }


    async find_latest_epoch(){
	
    }    
    
    async calculate_base_reward(epoch_array){

	try{
	    let total_rewards = 0
	    
	    //default value of epoch_array
	    if (epoch_array == null){
		epoch_array = _.range(this.startEpoch, this.find_latest_epoch()-1)	    
	    }
	    
	    //first get a saturation tables
	    const [rsaturation, rsat_meta] = await db.sequelize.query(`SELECT * FROM  PoolHistories where epoch BETWEEN ${epoch_array[0]} and ${epoch_array.slice(-1)[0]}`);

	    console.log(rsaturation)

	    let a = new Object()
	    
	    rsaturation.map(x => {
		a[x.epoch] = x.activeStake
	    })

	    console.log(a)
	    
	    //Get the stakes corresponding to the stake addr.
	    const [sresult, smeta] = await db.sequelize.query(`SELECT * FROM StakePools where stakeAddr="${this.saddr}" and epoch BETWEEN ${epoch_array[0]} and ${epoch_array.slice(-1)[0]}`);

	    console.log(sresult)

	    let reward = {}
	    sresult.map(x => {
		let saturation = a[x.epoch]/this.maxDelegation
		let es = (saturation > 1.0)? 1: saturation
		console.log(`Epoch ${x.epoch} saturation is ${es}`)

		reward[x.epoch] = (x.Amount/Math.pow(10,6))*this.rewardFactor*es
		total_rewards += reward[x.epoch]
	    })

	    reward["total"] = total_rewards
	    return reward
	    
	}
	catch(err){
	    console.log(err)
	}

    }    
    
}


class ExtraReward{
    constructor(){
	this.reward_multiplier_thresholds = [10000*Math.pow(10,6), 20000*Math.pow(10,6), 70000*Math.pow(10,6)]
    }
    
    async calc_region_params(region_index){	
	let total_extra_rewards = 0.18*Math.pow(10,9)
	let start_epoch = 310

	this.region_index = region_index
	this.total_num_epochs = 24 //will be updated later 
	
	switch(region_index){
	case 0:
	    this.amount_of_reward_allocated = 0.1*this.total_extra_rewards
	    this.epoch_lower  = start_epoch
	    this.epoch_higher = start_epoch+Math.round(this.total_num_epochs*0.1)
	    break;
	case 1:
	    this.amount_of_reward_allocated = 0.2*this.total_extra_rewards
	    this.epoch_lower  = start_epoch+Math.round(this.total_num_epochs*0.1)
	    this.epoch_higher = start_epoch+Math.round(this.total_num_epochs*0.3)
	    break;
	case 2:
	    this.amount_of_reward_allocated = 0.7*this.total_extra_rewards
	    this.epoch_lower = start_epoch+Math.round(this.total_num_epochs*0.3)
	    this.epoch_higher = start_epoch + this.total_num_epochs
	    break;
	default:
	    console.log("Does not match any region")
	    this.amount_of_reward_allocated = 0
	}	
    }


    async determine_unit_of_reward(){
	try{
	    //first get a saturation tables
	    const [num_1x_delegators, rsat_meta] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${epoch_higher} and Amount > 10000000000 and Amount < 20000000000;`);
	    const [num_2x_delegators, rsat_meta] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${epoch_higher} and Amount > 20000000000 and Amount < 70000000000;`);
	    const [num_3x_delegators, rsat_meta] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${epoch_higher} and Amount > 70000000000;`);

	    const total_weight = num_1x_delegators + 2*num_2x_delegators + 3* num_3x_delegators
	    const unit_of_reward = this.amount_of_reward_allocated / total_weight
	    
	    return unit_of_reward	    
	}
	catch(err){
	    console.log(err)
	}
    }

    async determine_reward_multiplier(amount){
	var multiplier = 0
	
	if (amount > this.reward_multiplier_thresholds[0] and amount < this.reward_multiplier_thresholds[1]){
	    multiplier = 1
	}

	if (amount > this.reward_multiplier_thresholds[1] and amount < this.reward_multiplier_thresholds[2]){
	    multiplier = 2
	}

	if (amount > this.reward_multiplier_thresholds[2]){
	    multiplier = 3
	}
	return multiplier	
    }

    async calc_extra_reward(sAddr){
	try{
            const [num_epoch_staked, rsat_meta] = await db.sequelize.query(`SELECT COUNT(epoch) FROM StakePools where stakeAddr=${sAddr}`);

	    if (num_epoch_staked >= this.epoch_higher){
		const  [amount_staked, rsat_meta] = await db.sequelize.query(`SELECT AVG(Amount) FROM `StakePools` where stakeAddr=${sAddr} and epoch>=${epoch_lower} and epoch<=${this.epoch_higher};`);
		const multiplier = this.determine_reward_multiplier(amount_staked)

		return multiplier*this.determine_unit_of_reward()
	    }	    
	    
	}
	catch(err){
	    console.log(err)
	}
    }
    
}

module.exports = {
    service,
    dbConnect,
    Rewards
}


if (require.main === module){


    (async() => {
	
	var saddr = "stake1u80038u04hrlrn5cjeskjmtddpahgnvxqsmmy7d8xq6uecq62zwsw"

	//Connect to db
	await dbConnect(false)

	var r = new Rewards(saddr)		
	let reward = await r.calculate_base_reward([332,333])
	console.log(reward)

	var er = new ExtraReward()
	
    })()
}
    

