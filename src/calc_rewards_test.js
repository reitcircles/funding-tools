#!/usr/bin/env node

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

//Amounts in lovelace
const STAKE_AMOUNT_A = 50000*Math.pow(10,6)
const STAKE_AMOUNT_B = 100000*Math.pow(10,6)

function getStake(epoch){    
    return (epoch < 254)? STAKE_AMOUNT_A:STAKE_AMOUNT_B 
}


const EPOCHS = _.range(250,260)


//Some mock data that we require
const POOLID="0ce16f30fdae49328160cb3d68e3fd109ca86b580f4f47882307f943"
const poolHistory = [
    {"poolID": POOLID, "epoch": EPOCHS[0], "activeStake":250000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[1], "activeStake":250000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[2], "activeStake":250000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[3], "activeStake":250000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[4], "activeStake":250000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[5], "activeStake":750000000000, "activeSize": 0.02, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[6], "activeStake":750000000000, "activeSize": 0.06, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[7], "activeStake":750000000000, "activeSize": 0.06, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[8], "activeStake":750000000000, "activeSize": 0.06, "rewards": 10000},
    {"poolID": POOLID, "epoch": EPOCHS[9], "activeStake":750000000000, "activeSize": 0.06, "rewards": 10000},
]


const StakePools = [
    {"poolID": POOLID, "epoch": 250, "stakeAddr":sarray[0], "Amount":STAKE_AMOUNT_A},
    {"poolID": POOLID, "epoch": 250, "stakeAddr":sarray[1], "Amount":STAKE_AMOUNT_A},
    {"poolID": POOLID, "epoch": 250, "stakeAddr":sarray[2], "Amount":STAKE_AMOUNT_A},
    {"poolID": POOLID, "epoch": 250, "stakeAddr":sarray[3], "Amount":STAKE_AMOUNT_A},
    {"poolID": POOLID, "epoch": 250, "stakeAddr":sarray[4], "Amount":STAKE_AMOUNT_A}
]


function generate_stakepools(){
    var spools = []
    var num_delegators = 5
    var delegator_per_epoch = new Array(num_delegators)

    console.log(delegator_per_epoch)
    
    let t = EPOCHS.map(epoch => {

        console.log(epoch)

        let depoch = _.range(num_delegators).map((x,index) =>{
            return {"poolID": POOLID, "epoch": epoch, "stakeAddr":sarray[index], "Amount":getStake(epoch)}
        })        
        spools = spools.concat(depoch)
    })

    return spools    
}


// describe("Testing the REIT rewards calculator", function() {
//   describe("basic_reward_calculation", function() {
//       //Now replace the function cr.db with our own function.
//       //This should then supply the above mock data instead of using the database.

//       const db = sinon.createStubInstance(cr.db.sequelize);
//       db.query.callsFake((q) => {
//           if (query.includes("PoolHistories")){
//               return poolHistory
//           }
          
//           if (query.includes("StakePools")){
//               return StakePools
//           }
//       })
//   });

//   describe("Hex to RGB conversion", function() {
//    // specification for HEX to RGB converter
//   });
// });


module.exports = {
    generate_stakepools
}
