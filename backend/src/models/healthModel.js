const { query } = require("../config/database");

const checkDatabase = async () => {
  const result = await query(
    "SELECT current_database() AS database_name, NOW() AS server_time"
  );

  return {
    status: "up",
    databaseName: result.rows[0].database_name,
    serverTime: result.rows[0].server_time
  };
};

module.exports = {
  checkDatabase
};
