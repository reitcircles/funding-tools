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

    async fetch_data(epoch_array){
        try{

            //default value of epoch_array
	    if (epoch_array == null){
		epoch_array = _.range(this.startEpoch, this.find_latest_epoch()-1)	    
	    }
            
            //first get a saturation tables
	    const [rsaturation, rsat_meta] = await db.sequelize.query(`SELECT * FROM  PoolHistories where epoch BETWEEN ${epoch_array[0]} and ${epoch_array.slice(-1)[0]}`);

            console.log(rsaturation)
            
            //Get the stakes corresponding to the stake addr.
	    const [sresult, smeta] = await db.sequelize.query(`SELECT * FROM StakePools where stakeAddr="${this.saddr}" and epoch BETWEEN ${epoch_array[0]} and ${epoch_array.slice(-1)[0]}`);
            console.log(sresult)
            
            return {
                rsaturation,
                sresult
            }
            
        }
        catch(err){
            console.error(err)
        }
        
    }
    
    async calculate_base_reward(saturationInfo, stakingInfo){

	try{
	    let total_rewards = 0
            
            
	    let a = new Object()	    
	    saturationInfo.map(x => {
		a[x.epoch] = x.activeStake
	    })

	    console.log(a)


	    let reward = {}
	    stakingInfo.map(x => {
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


//Set of constants relevant for calculation
const START_EPOCH  = process.env.BEGIN_EPOCH
const TOTAL_EPOCHS = 24
const END_EPOCH    = START_EPOCH+TOTAL_EPOCHS

class ExtraReward{
    constructor(){
	this.total_num_epochs = 24 //will be updated later 
	this.reward_multiplier_thresholds = [10000*Math.pow(10,6), 20000*Math.pow(10,6), 70000*Math.pow(10,6)]
	this.epoch_boundaries = [START_EPOCH+0.1*TOTAL_EPOCHS, START_EPOCH+0.3*TOTAL_EPOCHS, START_EPOCH+TOTAL_EPOCHS]
	this.staked_amount_array = [process.env.STAKE_THRESH_1,process.env.STAKE_THRESH_2,process.env.STAKE_THRESH_3].map(x => { return x*Math.pow(10,6)})
    }
    

    async determine_unit_of_reward(){
	try{
	    //first get a saturation tables
	    const [num_1x_delegators, rsat_meta_1] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${this.epoch_higher} and Amount > ${this.staked_amount_array[0]} and Amount < ${this.staked_amount_array[1]};`);
	    const [num_2x_delegators, rsat_meta_2] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${this.epoch_higher} and Amount > ${this.staked_amount_array[1]} and Amount < ${this.staked_amount_array[2]};`);
	    const [num_3x_delegators, rsat_meta_3] = await db.sequelize.query(`select COUNT(DISTINCT(stakeAddr)) from StakePools where epoch >=${this.epoch_lower} and epoch <= ${this.epoch_higher} and Amount > ${this.staked_amount_array[2]};`);

	    const total_weight = num_1x_delegators + 2*num_2x_delegators + 3* num_3x_delegators
	    const unit_of_reward = this.amount_of_reward_allocated / total_weight
	    
	    return unit_of_reward	    
	}
	catch(err){
	    console.log(err)
	}
    }

    calc_region_params(region_index){	
	let total_extra_rewards = process.env.TOTAL_EXTRA_REWARD*Math.pow(10,9)
	let amount_of_reward_allocated = 0
	let epoch_higher = 0
	let epoch_lower  = 0
	
	switch(region_index){
	case 0:
	    amount_of_reward_allocated = process.env.REGION_A_WEIGHT*this.total_extra_rewards
	    epoch_lower  = START_EPOCH
	    epoch_higher = this.epoch_boundaries[1]
	    break;
	case 1:
	    amount_of_reward_allocated = process.env.REGION_B_WEIGHT*this.total_extra_rewards
	    epoch_lower  = this.epoch_boundaries[0]
	    epoch_higher = this.epoch_boundaries[1]
	    break;
	case 2:
	    amount_of_reward_allocated = process.env.REGION_C_WEIGHT*this.total_extra_rewards
	    epoch_lower  = this.epoch_boundaries[1]
	    epoch_higher = this.epoch_boundaries[2]
	    break;
	default:
	    console.log("Does not match any region")
	    this.amount_of_reward_allocated = 0
	}

	return { amount_of_reward_allocated, epoch_lower, epoch_higher }

    }


    async determine_reward_multiplier(amount){
	var multiplier = 0
	
	if (amount > this.reward_multiplier_thresholds[0] &&  amount < this.reward_multiplier_thresholds[1]){
	    multiplier = 1
	}

	if (amount > this.reward_multiplier_thresholds[1] && amount < this.reward_multiplier_thresholds[2]){
	    multiplier = 2
	}

	if (amount > this.reward_multiplier_thresholds[2]){
	    multiplier = 3
	}
	return multiplier	
    }

    async calc_extra_reward(sAddr,region){
	try{
	    const region_params = this.calc_region_params(region)
            const [num_epoch_staked, rsat_meta_1] = await db.sequelize.query(`SELECT COUNT(epoch) FROM StakePools where stakeAddr=${sAddr}`);

	    if (num_epoch_staked >= region_params.epoch_higher){
		const  [amount_staked, rsat_meta_2] = await db.sequelize.query(`SELECT AVG(Amount) FROM StakePools where stakeAddr=${sAddr} and epoch>=${region_params.epoch_lower} and epoch<=${region_params.epoch_higher};`);
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
    db,
    service,
    dbConnect,
    Rewards,
    ExtraReward
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
    

