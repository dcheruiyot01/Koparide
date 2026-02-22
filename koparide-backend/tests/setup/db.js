const sequelize = require('../../config/db');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

