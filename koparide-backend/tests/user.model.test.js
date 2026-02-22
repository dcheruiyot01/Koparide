// Import the User model we want to test
const User = require('../models/User');


describe('User Model', () => {

  /**
   * TEST 1: Creating a valid user
   * --------------------------------
   * This ensures:
   *  - Sequelize can insert a user
   *  - UUID is generated
   *  - Fields are stored correctly
   */
  test('creates a user with valid data', async () => {
    const user = await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: 'hashedpassword', // We will hash later in auth tests
      role: 'renter',
    });

    // The user should now exist in the DB
    expect(user.id).toBeDefined(); // UUID auto-generated
    expect(user.email).toBe('daniel@example.com');
    expect(user.role).toBe('renter');
  });

  /**
   * TEST 2: Missing required fields
   * --------------------------------
   * This ensures Sequelize enforces:
   *  - email is required
   *  - password is required
   *  - name is required
   */
  test('fails when email is missing', async () => {
    await expect(
      User.create({
        name: 'No Email',
        password: 'hashedpassword',
      })
    ).rejects.toThrow(); // Sequelize should throw a validation error
  });

  /**
   * TEST 3: Unique email constraint
   * --------------------------------
   * This ensures:
   *  - Duplicate emails are rejected
   *  - Unique constraint is working
   */
  test('fails when email is duplicate', async () => {
    // First user
    await User.create({
      name: 'First',
      email: 'duplicate@example.com',
      password: 'hashedpassword',
    });

    // Second user with same email should fail
    await expect(
      User.create({
        name: 'Second',
        email: 'duplicate@example.com',
        password: 'hashedpassword',
      })
    ).rejects.toThrow();
  });

  /**
   * TEST 4: Invalid role
   * --------------------------------
   * This ensures:
   *  - Only allowed ENUM values are accepted
   *  - Invalid roles throw an error
   */
  test('fails when role is invalid', async () => {
    await expect(
      User.create({
        name: 'Bad Role',
        email: 'badrole@example.com',
        password: 'hashedpassword',
        role: 'invalid_role', // Not in ENUM('renter', 'host', 'admin')
      })
    ).rejects.toThrow();
  });
});
