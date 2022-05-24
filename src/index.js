#!/usr/bin/env node


require('dotenv').config()

// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
const createError = require('http-errors')
const cr = require("./calc_rewards")
const cors = require('@fastify/cors');



fastify.register((fastify, options, done) => {
    fastify.register(require("@fastify/cors"), {
        origin: "*",
        methods: ["GET"]
    });
    done();
});



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
        var data =  await R.fetch_data([312,313,314,315,316])
	let reward = await R.calculate_base_reward(data.rsaturation, data.sresult)
        
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
	    await fastify.listen({ port: process.env.PORT, host: "0.0.0.0" })
	} catch (err) {
	    fastify.log.error(err)
	    process.exit(1)
	}
    }
        
    start()
    
}
