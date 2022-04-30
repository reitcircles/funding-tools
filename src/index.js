#!/usr/bin/env node


// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
const createError = require('http-errors')

const cr = require("./calc_rewards")


// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})


fastify.get('/rewards/:stakeAddr', async (request, reply) => {

    console.log(`rewards to be calculated for the staking address:${request.params["stakeAddr"]}`)

    console.log(request)
    if (request.params.stakeAddr != null){
	//TODO: Verify the stake address format.

	//Connect to db
	await cr.dbConnect(false)
	
	let R = new cr.Rewards(request.params.stakeAddr)
	
	//Fetch data from blockfrost to custom db
	let reward = await R.calculate_base_reward([332,333])

	reply.send({baseReward: reward})
    }
    else
    {
	reply.send(createError(404, "The stakeAddress is missing"))
    }
    
})


if (require.main === module){
    
    // Run the server!
    const start = async () => {
	try {
	    await fastify.listen(3000)
	} catch (err) {
	    fastify.log.error(err)
	    process.exit(1)
	}
    }
        
    start()
    
}
