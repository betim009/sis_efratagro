const healthModel = require("../models/healthModel");

const getSystemHealth = async () => {
  const databaseStatus = await healthModel.checkDatabase();

  return {
    status: "success",
    message: "API operacional",
    data: {
      api: {
        status: "up",
        timestamp: new Date().toISOString()
      },
      database: databaseStatus
    }
  };
};

module.exports = {
  getSystemHealth
};
