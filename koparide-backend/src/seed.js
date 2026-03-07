// src/seed.js
const { sequelize, User, Car, CarImage } = require('../models'); // adjust path if needed

const cars = [
    { name: "Mitsubishi Mirage G4", year: 2018, type: "Sedan", pricePerDay: 5000 },
    { name: "Mitsubishi Mirage", year: 2020, type: "Hatchback", pricePerDay: 4000 },
    { name: "Toyota Corolla", year: 2021, type: "Sedan", pricePerDay: 4500 },
    { name: "Honda CR-V", year: 2019, type: "SUV", pricePerDay: 10000 },
    { name: "Tesla Model 3", year: 2022, type: "Sedan", pricePerDay: 15000 },
    { name: "Isuzu D-Max", year: 2020, type: "Truck", pricePerDay: 8000 },
    { name: "Mazda CX-5", year: 2021, type: "SUV", pricePerDay: 9000 },
    { name: "Subaru Forester", year: 2019, type: "SUV", pricePerDay: 7000 },
];

const imagePool = [
    "http://localhost:4000/uploads/licenses/1772651847333-527049013.png",
    "http://localhost:4000/uploads/licenses/alvano-putra-TdAatXFLWak-unsplash.jpg",
    "http://localhost:4000/uploads/licenses/ivan-kazlouskij-GjKmrL2QgSM-unsplash.jpg",
    "http://localhost:4000/uploads/licenses/nick-mollenbeck-wR30lR9ZdJQ-unsplash.jpg",
    "http://localhost:4000/uploads/licenses/sven-d-a4S6KUuLeoM-unsplash.jpg",
];

// helper to shuffle and pick N images
function pickRandomImages(pool, count = 3) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function splitMakeModel(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const make = parts[0] || 'Unknown';
    const model = parts.length > 1 ? parts.slice(1).join(' ') : 'Model';
    return { make, model };
}

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('DB connection OK');

        await sequelize.sync({ force: true });
        console.log('Database synced (force: true)');

        let user = await User.findOne({ where: { email: 'host@example.com' } });
        if (!user) {
            user = await User.create({
                email: 'host@example.com',
                name: 'Demo Host',
                initials: 'DH',
                password: 'demo123',
                role: 'host'
            });
            console.log('Created demo user:', user.id, user.email);
        } else {
            console.log('Demo user exists:', user.id, user.email);
        }

        for (const carData of cars) {
            try {
                const { make, model } = splitMakeModel(carData.name);

                const existing = await Car.findOne({ where: { make, model, year: carData.year } });
                if (existing) {
                    console.log(`Skipping existing car: ${make} ${model} (${carData.year})`);
                    continue;
                }

                const classification = carData.type || 'Saloon';
                const allowed = ['SUV','Sedan','Saloon','Pickup','Truck','Hatchback','Van','Coupe','Convertible'];
                if (!allowed.includes(classification)) {
                    console.warn(`Classification "${classification}" not allowed; defaulting to "Saloon"`);
                }

                const car = await Car.create({
                    ownerId: user.id,
                    make,
                    model,
                    year: carData.year,
                    pricePerDay: Number(carData.pricePerDay).toFixed(2),
                    classification: allowed.includes(classification) ? classification : 'Saloon',
                    status: 'approved',

                    // ✅ new feature fields with random/demo values
                    seats: Math.floor(Math.random() * 3) + 4, // 4–6 seats
                    fuelType: ['Petrol', 'Diesel', 'Hybrid', 'Electric'][Math.floor(Math.random() * 4)],
                    mpg: (Math.random() * (40 - 15) + 15).toFixed(2), // 15–40 mpg
                    transmission: ['Automatic', 'Manual'][Math.floor(Math.random() * 2)],
                    cruiseControl: Math.random() < 0.5,
                    cc: Math.floor(Math.random() * (3000 - 1000) + 1000)
                });

                console.log(`Inserted car id=${car.id} ${car.make} ${car.model} (${car.year})`);

                // ✅ assign at least 3 random images
                const selectedImages = pickRandomImages(imagePool, 3 + Math.floor(Math.random() * 3)); // 3–5 images
                for (let i = 0; i < selectedImages.length; i++) {
                    const img = await CarImage.create({
                        carId: car.id,
                        url: selectedImages[i],
                        altText: `${carData.name} image ${i + 1}`,
                        isPrimary: i === 0, // first one is always primary
                        position: i
                    });
                    console.log(`  -> Added image id=${img.id}`);
                }
            } catch (err) {
                console.error(`Failed to seed car "${carData.name}":`,
                    err.errors ? err.errors.map(e => e.message) : err.stack || err);
            }
        }

        console.log('Seed complete.');
    } catch (err) {
        console.error('Fatal seed error:', err && err.stack ? err.stack : err);
    } finally {
        try {
            await sequelize.close();
            console.log('DB connection closed.');
        } catch (closeErr) {
            console.error('Error closing DB connection:', closeErr);
        }
    }
}

seed();