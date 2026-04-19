const healthService = require("../services/healthService");

const getHealthStatus = async (request, response, next) => {
  try {
    const status = await healthService.getSystemHealth();
    return response.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getHealthStatus
};
