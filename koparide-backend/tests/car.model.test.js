/**
 * Car Model Tests
 * -------------------------
 * Validates Car model fields, defaults, classification,
 * soft delete, and associations with User (owner & renter).
 */

const { Sequelize } = require('sequelize');
const User = require('../models/user');   // already defined Sequelize model
const Car = require('../models/car');     // already defined Sequelize model

describe('Car Model', () => {
    let sequelize;

    beforeAll(async () => {
        // Use in-memory SQLite for testing
        sequelize = new Sequelize('sqlite::memory:', { logging: false });

        // Reinitialize models with test sequelize instance
        User.init(User.rawAttributes, { sequelize, modelName: 'User' });
        Car.init(Car.rawAttributes, { sequelize, modelName: 'Car' });

        // Associations
        Car.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
        User.hasMany(Car, { foreignKey: 'ownerId', as: 'cars' });
        Car.belongsTo(User, { foreignKey: 'rented_to', as: 'renter' });

        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('✅ should create a car with status pending and default classification', async () => {
        const owner = await User.create({ name: 'Daniel', email: 'owner@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            pricePerDay: 40.00
        });

        expect(car.status).toBe('pending');
        expect(car.classification).toBe('Saloon');
        expect(car.is_deleted).toBe(false);
    });

    it('❌ should fail if required fields are missing', async () => {
        await expect(Car.create({})).rejects.toThrow();
    });

    it('✅ should accept valid classification', async () => {
        const owner = await User.create({ name: 'Host', email: 'host@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Toyota',
            model: 'RAV4',
            year: 2021,
            pricePerDay: 60.00,
            classification: 'SUV'
        });

        expect(car.classification).toBe('SUV');
    });

    it('❌ should reject invalid classification', async () => {
        const owner = await User.create({ name: 'Host2', email: 'host2@example.com', password: 'hashed' });

        await expect(Car.create({
            ownerId: owner.id,
            make: 'Toyota',
            model: 'Hilux',
            year: 2022,
            pricePerDay: 70,
            classification: 'Spaceship' // invalid
        })).rejects.toThrow(/Validation error/);
    });

    it('✅ should associate car with an owner', async () => {
        const owner = await User.create({ name: 'OwnerUser', email: 'owneruser@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            pricePerDay: 50.00
        });

        const fetchedCar = await Car.findOne({ where: { id: car.id }, include: 'owner' });
        expect(fetchedCar.owner.email).toBe('owneruser@example.com');
    });

    it('✅ should allow assigning a renter to a car', async () => {
        const owner = await User.create({ name: 'Owner', email: 'owner3@example.com', password: 'hashed' });
        const renter = await User.create({ name: 'Renter', email: 'renter@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Mazda',
            model: 'CX-5',
            year: 2022,
            pricePerDay: 55.00,
            rented_to: renter.id
        });

        const fetchedCar = await Car.findOne({ where: { id: car.id }, include: 'renter' });
        expect(fetchedCar.renter.email).toBe('renter@example.com');
    });

    it('✅ should clear rented_to if renter is deleted', async () => {
        const owner = await User.create({ name: 'Owner4', email: 'owner4@example.com', password: 'hashed' });
        const renter = await User.create({ name: 'TempRenter', email: 'temp@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Ford',
            model: 'Focus',
            year: 2021,
            pricePerDay: 45.00,
            rented_to: renter.id
        });

        await renter.destroy();
        const updatedCar = await Car.findByPk(car.id);
        expect(updatedCar.rented_to).toBeNull();
    });

    it('✅ should mark car as deleted when is_deleted is set', async () => {
        const owner = await User.create({ name: 'Owner5', email: 'owner5@example.com', password: 'hashed' });

        const car = await Car.create({
            ownerId: owner.id,
            make: 'Nissan',
            model: 'Altima',
            year: 2019,
            pricePerDay: 35.00
        });

        await car.update({ is_deleted: true });
        const updatedCar = await Car.findByPk(car.id);
        expect(updatedCar.is_deleted).toBe(true);
    });
});
