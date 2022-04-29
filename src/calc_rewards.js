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


class Rewards{
    constructor(stakeAddr){
	this.saddr = stakeAddr
	this.rewardFactor = 0.19
	this.maxDelegation = 64*10^12//in lovelace
    }

    async calculate_base_reward(epoch_array){

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

	let reward = 0
	sresult.map(x => {
	    let epoch_saturation = a[x.epoch]/this.maxDelegation
	    console.log(`Epoch ${x.epoch} saturation is ${epoch_saturation}`)
	    reward += (x.Amount/10^6)*this.rewardFactor*epoch_saturation
	})

	return reward
    }    
    
    async connect_db(initialize){
	await db.sequelize.authenticate();
	console.log('Connection has been established successfully.');
	if (initialize){
	    await db.StakePool.sync({ force: true });
	    console.log("The table for the StakePool model was just (re)created!");
	}		
    }
    
}

(async() => {

    var saddr = "stake1u80038u04hrlrn5cjeskjmtddpahgnvxqsmmy7d8xq6uecq62zwsw"
    
    var r = new Rewards(saddr)
    
    //Connect to db
    await r.connect_db(false)

    //Fetch data from blockfrost to custom db
    let reward = await r.calculate_base_reward([332,333])
    console.log(reward)
})()
    

