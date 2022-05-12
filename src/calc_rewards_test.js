#!/usr/bin/env node

'use strict';

const mocha = require('mocha')
const assert = require('assert');
const sinon = require("sinon")
const sequelize = require('sequelize')
const smock = require('sequelize-mock')
const cr = require("./calc_rewards")
const _ = require("lodash")

const sarray = [
    "stake1u80038u04hrlrn5cjeskjmtddpahgnvxqsmmy7d8xq6uecq62zwsw",
    "stake1u805ag4f7zugrt4flqv0fwum5jv2688ngrkyhndchyuhxdquhzevd",
    "stake1u806q23cdux0yh8z8xtm9jldytv5hxq6xfc84hepjjz60jghvkqd2",
    "stake1u80c6v9v6kpltaftfr2460wetzk0fpckqw5leflhpllkq4cjz3jyt",
    "stake1u82gmu32tucey87rjmmj3wjqweva5fycwy8y82nqfxcjd5gacrccg",
    "stake1u837mua2wxqvry83uel4986grr48jn42lfd8l0v3nhuyh7q95akug",
    "stake1u83d5uv62wmcz3gwqnlvnqahhv3hvja25sd0z54udw3talcp256hl",
    "stake1u83s9luwrlu0gvm273m6sgj9l0m6080up69pk503cafccmq2vn0gz",
    "stake1u83w0jx9yc8tl028yhv0zjz5c3a6t24w54myv88tqq4au6gt3l4m6",
    "stake1u83w0jx9yc8tl028yhv0zjz5c3a6t24w54myv88tqq4au6gt3l4m6"
]

const NUM_DELEGATORS = 5

//Amounts in lovelace
const STAKE_AMOUNT_A = 50000*Math.pow(10,6)   //amount in lovelace
const STAKE_AMOUNT_B = 100000*Math.pow(10,6)  //Amount in lovelace

const TOTAL_STAKE_A = NUM_DELEGATORS*STAKE_AMOUNT_A
const TOTAL_STAKE_B = TOTAL_STAKE_A + NUM_DELEGATORS*STAKE_AMOUNT_B

const POOL_SATURATION = 64*Math.pow(10,12) //in lovelace. 64M ADA.
const EPOCHS = _.range(250,260)


function getStake(epoch){    
    return (epoch < 254)? STAKE_AMOUNT_A:STAKE_AMOUNT_B 
}


//Some mock data that we require
const POOLID="0ce16f30fdae49328160cb3d68e3fd109ca86b580f4f47882307f943"


function generate_poolhistory(){
    
    return  EPOCHS.map((epoch,index) => {
        let stake = (index < 5)?TOTAL_STAKE_A:TOTAL_STAKE_B        
        return  {"poolID": POOLID, "epoch": epoch, "activeStake":stake, "activeSize": 0.02, "rewards": 10000}
    })    
}

function generate_stakepools(){
    var spools = []
    var num_delegators = 5
    var delegator_per_epoch = new Array(num_delegators)

    let t = EPOCHS.map(epoch => {

        let depoch = _.range(num_delegators).map((x,index) =>{
            return {"poolID": POOLID, "epoch": epoch, "stakeAddr":sarray[index], "Amount":getStake(epoch)}
        })        
        spools = spools.concat(depoch)
    })

    return spools    
}


function get_pool_saturation(epoch, phistory){
    const pool_saturation = 0
    let saturation = 0
    
    phistory.forEach(entry => {
        if (entry.epoch == epoch){
            saturation =  entry.activeStake/POOL_SATURATION
        }
    })

    return saturation    
}

function calculate_rewards_separately(stake_addr,phistory, spools){
    const SWAP_FACTOR = cr.ADA_REIT_stake_conv_factor
    let total_rewards = 0

    console.log("-------------------------REFERENCE CALCULATION OF REWARDS---------------------------")
    
    spools.forEach((entry, index) => {
        
        if (entry.stakeAddr == stake_addr){
            const stake = entry.Amount
            const epoch = entry.epoch
            const pool_epoch_saturation = get_pool_saturation(epoch, phistory)

            //console.log(`Calc saturation in epoch:${epoch} is ${pool_epoch_saturation} and stake this epoch:${stake}`)
            
            let reward_this_epoch = SWAP_FACTOR*pool_epoch_saturation*stake/Math.pow(10,6)
            
            console.log(`rewards this epoch ${entry.epoch}  is ${reward_this_epoch} using saturation:${pool_epoch_saturation} and stake:${stake}` )
            total_rewards +=  reward_this_epoch //convert back from lovelace 
        }
    })

    console.log(`total rewards calculated is:${total_rewards}`)
    return total_rewards    
}    

describe("Testing the REIT rewards calculator", () => {

    it("basic_reward_calculation", async () => {
        let stake_addr    = sarray[0]
        let phistory = generate_poolhistory()
        let spools   = generate_stakepools()

        //first calculate using library function
        let rewards  = new cr.Rewards(stake_addr)
        let reit_rewards = await rewards.calculate_base_reward(phistory,spools)

        //Then calculate independently
        let calculated_rewards = calculate_rewards_separately(stake_addr,phistory,spools)

        console.log(`REIT tokens as reward: ${reit_rewards.total}`)
        console.log(`REIT rewards calculated separately:${calculated_rewards}`)

        //then compare both
        assert.equal(reit_rewards.total, calculated_rewards, "Could not match calculated rewards with that from library")
        
    });
});


module.exports = {
    generate_poolhistory,
    generate_stakepools
}
