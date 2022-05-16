require('dotenv').config()
const { Sequelize, DataTypes } = require('sequelize');


const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOSTNAME,
    dialect: 'mysql',
    pool: {
      max: 50,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
});


const StakePool = sequelize.define('StakePool', {
    // Model attributes are defined here
    poolid: {
	type: DataTypes.STRING,
	primaryKey: true,
	allowNull: false
    },
    epoch: {
	type: DataTypes.STRING,
	primaryKey: true,
	allowNull: false
    },
    stakeAddr: {
	type: DataTypes.STRING,
	primaryKey: true,
	allowNull: false
    },
    Amount: {
	type: DataTypes.STRING,
	allowNull: true
    }
    
}, {
  // Other model options go here
});


const PoolHistory = sequelize.define("PoolHistory", {
    // Model attributes are defined here
    poolid: {
	type: DataTypes.STRING,
	primaryKey: true,
	allowNull: false
    },
    epoch: {
	type: DataTypes.STRING,
	primaryKey: true,
	allowNull: false
    },
    activeStake:{
	type:DataTypes.BIGINT,
	allowNull: false
    },
    activeSize:{
	type:DataTypes.FLOAT,
	allowNull: true
    },
    rewards:{
	type: DataTypes.BIGINT,
	allowNull: false
    }
    
}, {
  // Other model options go here
});


module.exports = {
    sequelize,
    StakePool,
    PoolHistory
}

if (require.main === module){
    (async() => {

	try {
	    await sequelize.authenticate();
	    console.log('Connection has been established successfully.');
	    await StakePool.sync({ force: true });
	    console.log("The table for the StakePool model was just (re)created!");
	    await PoolHistory.sync({ force: true });
	    console.log("The table for the StakePool model was just (re)created!");


	} catch (error) {
	    console.error('Unable to connect to the database:', error);
	}
    })()
    
}
    
