/**
 * =================================================================
 * Prestige Rentals - Master Backend API
 * =================================================================
 * Node.js Express server for the car rental application.
 * * SECURED VERSION
 * =================================================================
 */

// --- IMPORTS AND INITIAL SETUP ---
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- SECURITY MIDDLEWARE ---

// Set secure HTTP headers
app.use(helmet());

// Configure CORS for specific origins
const corsOptions = {
    origin: [
        'http://localhost:4321', // Your Astro dev server
        'https://your-production-domain.com' // CHANGE THIS to your live site URL
    ]
};
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// --- RATE LIMITERS ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: { success: false, error: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 registration requests per hour
    message: { success: false, error: 'Too many accounts created from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 reset requests per hour
    message: { success: false, error: 'Too many password reset requests, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});


const PORT = 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Set it in your .env file.');
    process.exit(1);
}

// --- DATABASE CONNECTION POOL ---
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'car_rental_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// --- HELPER FUNCTIONS ---
function detectCardType(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    return 'Card';
}

// --- AUTHENTICATION MIDDLEWARE ---

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, error: 'No token provided. Access denied.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token. Access forbidden.' });
        }
        
        // Optional: Check if (user.job_title) exists for admin role
        req.user = user;
        next();
    });
}

function authenticateCustomer(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, error: 'No token provided. Access denied.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token. Access forbidden.' });
        }
        
        req.user = user; // This 'user' is the JWT payload { id, email, role }
        next();
    });
}

// Optional auth: Verifies token if present, but does not fail if missing
// Used for public routes that show user-specific data (e.g., "is_favorite")
function getAuthenticatedUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return next(); // No token, proceed as anonymous
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token is present but invalid, this is an error
            return res.status(403).json({ success: false, error: 'Invalid token.' });
        }
        
        req.user = user; // Token is valid, attach user
        next();
    });
}


// --- AUTHENTICATION ROUTES ---

// Employee Login
app.post('/api/employees/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const sql = 'SELECT * FROM Employees WHERE username = ?';
        const [rows] = await pool.query(sql, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const userPayload = {
                id: user.employee_id,
                job_title: user.job_title,
                role: 'employee'
            };
            const token = jwt.sign(
                userPayload,
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            // Send back user info, but OMIT the password hash
            const userInfo = {
                employee_id: user.employee_id,
                first_name: user.first_name,
                last_name: user.last_name,
                job_title: user.job_title
            };
            
            res.json({ success: true, user: userInfo, token: token });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Employee Login Error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Customer Login
app.post('/api/customers/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const sql = 'SELECT * FROM Customers WHERE email = ?';
        const [rows] = await pool.query(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const userProfile = {
                customer_id: user.customer_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            };
            
            const userPayload = {
                id: user.customer_id,
                email: user.email,
                role: 'customer'
            };
            
            const token = jwt.sign(
                userPayload,
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            res.json({ success: true, user: userProfile, token: token });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Customer Login Error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Customer Registration
app.post('/api/customers/register', registerLimiter, async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const sql = 'INSERT INTO Customers (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [first_name, last_name, email, hashedPassword]);
        
        res.status(201).json({ success: true, customerId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already exists.' });
        }
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: 'Failed to register.' });
    }
});

// Forgot Password
app.post('/api/customers/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await pool.query('SELECT customer_id FROM Customers WHERE email = ?', [email]);

        if (users.length > 0) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = Date.now() + 3600000; // 1 hour
            await pool.query('UPDATE Customers SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email]);
            
            // In a real app, you would email this link
            console.log(`SIMULATED EMAIL: Password reset link for ${email}: http://localhost:4321/reset-password?token=${token}`);
            
            res.json({ success: true, message: 'Password reset token generated (check server console).', token });
        } else {
            // Respond vaguely to prevent user enumeration
            res.json({ success: true, message: 'If an account exists, a link has been sent.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Reset Password
app.post('/api/customers/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const [users] = await pool.query('SELECT * FROM Customers WHERE reset_token = ? AND reset_token_expires > ?', [token, Date.now()]);

        if (users.length === 0) {
            return res.status(400).json({ success: false, error: 'Token is invalid or has expired.' });
        }

        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        await pool.query('UPDATE Customers SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE customer_id = ?', [newHashedPassword, users[0].customer_id]);
        res.json({ success: true, message: 'Password has been reset.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});


// --- PUBLIC & GENERAL DATA ROUTES ---

// Get Featured Cars for Homepage
app.get('/api/public/featured-cars', async (req, res) => {
    try {
        const sql = "SELECT car_id, make, model, daily_rate, image_url FROM Cars WHERE status = 'Available' ORDER BY daily_rate DESC LIMIT 3";
        const [rows] = await pool.query(sql);
        res.json({ success: true, cars: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Could not fetch featured cars.' });
    }
});

// Get Testimonials for Homepage
app.get('/api/public/testimonials', async (req, res) => {
    try {
        const sql = `
            SELECT r.rating, r.review_text, c.first_name, car.make, car.model
            FROM Reviews r JOIN Customers c ON r.customer_id = c.customer_id
            JOIN Cars car ON r.car_id = car.car_id
            WHERE r.rating >= 4 ORDER BY r.review_date DESC LIMIT 4`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, testimonials: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Could not fetch testimonials.' });
    }
});

// Get all Car Types
app.get('/api/car-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Car_Types');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all Car Features
app.get('/api/features', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name FROM Features ORDER BY name ASC');
        const featureNames = rows.map(row => row.name);
        res.json({ success: true, features: featureNames });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch features.' });
    }
});

// Get all rental Add-ons
app.get('/api/addons', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Addons ORDER BY price ASC');
        res.json({ success: true, addons: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not retrieve rental add-ons.' });
    }
});


// --- CAR & RENTAL ROUTES (CUSTOMER FACING) ---

// Get available cars with filtering
app.get('/api/cars/available', getAuthenticatedUser, async (req, res) => {
    try {
        const { type, search } = req.query;
        // Get customer ID from token if authenticated, otherwise 0
        const customerId = req.user ? req.user.id : 0; 
        
        let query = `
            SELECT c.*, ct.type_name, AVG(r.rating) as average_rating,
                   (SELECT COUNT(*) FROM FavoriteCars WHERE car_id = c.car_id AND customer_id = ?) as is_favorite
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            LEFT JOIN Reviews r ON c.car_id = r.car_id
            WHERE c.status = 'Available'
        `;
        const params = [customerId];

        if (type) {
            query += ' AND c.car_type_id = ?';
            params.push(type);
        }
        if (search) {
            query += ' AND (c.make LIKE ? OR c.model LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' GROUP BY c.car_id, ct.type_name';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching available cars:", error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Get details for a specific car
app.get('/api/cars/:id', getAuthenticatedUser, async (req, res) => {
    try {
        const customerId = req.user ? req.user.id : 0;
        
        const [carRows] = await pool.query(`
            SELECT c.*, ct.type_name FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            WHERE c.car_id = ?`, [req.params.id]);

        if (carRows.length === 0) {
            return res.status(404).json({ error: 'Car not found.' });
        }

        const [featureRows] = await pool.query(`
            SELECT f.name FROM CarFeatures cf
            JOIN Features f ON cf.feature_id = f.feature_id
            WHERE cf.car_id = ?`, [req.params.id]);

        const [reviewRows] = await pool.query(`
            SELECT r.*, cust.first_name FROM Reviews r
            JOIN Customers cust ON r.customer_id = cust.customer_id
            WHERE r.car_id = ? ORDER BY r.review_date DESC`, [req.params.id]);

        const reviews = reviewRows.map(r => ({
            ...r,
            isOwner: customerId ? r.customer_id === customerId : false
        }));

        res.json({
            car: { ...carRows[0], features: featureRows.map(f => f.name) },
            reviews
        });
    } catch (error) {
        console.error('Car Fetch Error:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Create a new rental (Authenticated)
app.post('/api/rentals/create', authenticateCustomer, async (req, res) => {
    // customer_id comes from the token, not the body
    const customer_id = req.user.id;
    const { car_id, pickup_date, due_date, addon_ids } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [carRows] = await connection.query('SELECT daily_rate FROM Cars WHERE car_id = ?', [car_id]);
        if (carRows.length === 0) throw new Error('Car not found.');
        const dailyRate = carRows[0].daily_rate;
        const rentalDays = Math.max(1, Math.ceil((new Date(due_date) - new Date(pickup_date)) / (1000 * 60 * 60 * 24)));
        let totalCost = rentalDays * dailyRate;

        if (addon_ids && addon_ids.length > 0) {
            const [addonRows] = await connection.query('SELECT SUM(price) as addons_total FROM Addons WHERE addon_id IN (?)', [addon_ids]);
            if (addonRows[0].addons_total) totalCost += parseFloat(addonRows[0].addons_total);
        }

        const [rentalResult] = await connection.query('INSERT INTO Rentals (customer_id, car_id, pickup_date, due_date, total_cost) VALUES (?, ?, ?, ?, ?)', [customer_id, car_id, pickup_date, due_date, totalCost]);
        const rentalId = rentalResult.insertId;

        if (addon_ids && addon_ids.length > 0) {
            const rentalAddonValues = addon_ids.map(id => [rentalId, id]);
            await connection.query('INSERT INTO RentalAddons (rental_id, addon_id) VALUES ?', [rentalAddonValues]);
        }

        await connection.query('INSERT INTO Payments (rental_id, amount, payment_date, payment_method) VALUES (?, ?, ?, "Card on File")', [rentalId, totalCost, pickup_date]);
        await connection.query("UPDATE Cars SET status = 'Rented' WHERE car_id = ?", [car_id]);

        await connection.commit();
        res.status(201).json({ success: true, rentalId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Database transaction failed.' });
    } finally {
        connection.release();
    }
});

// Return a rental (by customer) (Authenticated)
app.put('/api/rentals/return-by-customer/:rentalId', authenticateCustomer, async (req, res) => {
    const customerId = req.user.id;
    const { rentalId } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Verify this rental belongs to the authenticated customer
        const [rentalRows] = await connection.query('SELECT car_id, due_date, customer_id FROM Rentals WHERE rental_id = ?', [rentalId]);
        if (rentalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Rental not found.' });
        }
        
        if (rentalRows[0].customer_id !== customerId) {
            return res.status(403).json({ success: false, error: 'You are not authorized to return this rental.' });
        }

        const { car_id, due_date } = rentalRows[0];
        let earlyReturnFee = 0;
        if (new Date() < new Date(due_date)) {
            earlyReturnFee = 25.00;
            await connection.query('UPDATE Rentals SET late_fee = ? WHERE rental_id = ?', [earlyReturnFee, rentalId]);
        }

        await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [car_id]);
        await connection.query('UPDATE Rentals SET return_date = CURDATE() WHERE rental_id = ?', [rentalId]);

        await connection.commit();
        res.json({ success: true, feeApplied: earlyReturnFee });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Return process failed.' });
    } finally {
        connection.release();
    }
});

// Delete a rental record from history (Authenticated)
app.delete('/api/rentals/:rentalId', authenticateCustomer, async (req, res) => {
    const { rentalId } = req.params;
    const customerId = req.user.id; // Get ID from token
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rentalRows] = await connection.query(
            'SELECT customer_id FROM Rentals WHERE rental_id = ? AND return_date IS NOT NULL',
            [rentalId]
        );

        if (rentalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Completed rental record not found.' });
        }

        if (rentalRows[0].customer_id !== customerId) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this record.' });
        }

        await connection.query('DELETE FROM RentalAddons WHERE rental_id = ?', [rentalId]);
        await connection.query('DELETE FROM Payments WHERE rental_id = ?', [rentalId]);
        const [result] = await connection.query('DELETE FROM Rentals WHERE rental_id = ?', [rentalId]);

        await connection.commit();

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Rental record deleted.' });
        } else {
            await connection.rollback();
            res.status(404).json({ success: false, error: 'Rental could not be deleted.' });
        }
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Delete Rental Error:", error);
        res.status(500).json({ success: false, error: 'Failed to delete rental record due to a server error.' });
    } finally {
        if (connection) connection.release();
    }
});


// --- CUSTOMER PROFILE & DATA ROUTES (ALL AUTHENTICATED) ---

// Get customer profile
app.get('/api/customers/profile', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query('SELECT * FROM Customers WHERE customer_id = ?', [customerId]);
        if (rows.length > 0) {
            // Omit sensitive data before sending
            const { password, reset_token, reset_token_expires, ...profile } = rows[0];
            res.json({ success: true, profile: profile });
        } else {
            res.status(404).json({ success: false, error: 'Customer not found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// Update customer profile
app.put('/api/customers/profile', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { first_name, last_name, email, phone_number, address, city, state, zip_code } = req.body;
        const sql = 'UPDATE Customers SET first_name=?, last_name=?, email=?, phone_number=?, address=?, city=?, state=?, zip_code=? WHERE customer_id=?';
        const params = [first_name, last_name, email, phone_number, address, city, state, zip_code, customerId];
        await pool.query(sql, params);
        res.json({ success: true, message: 'Profile updated.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already in use.' });
        }
        res.status(500).json({ success: false, error: 'Failed to update profile.' });
    }
});

// Update customer password from profile
app.put('/api/customers/password', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        const [rows] = await pool.query('SELECT password FROM Customers WHERE customer_id = ?', [customerId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        
        if (!isMatch) {
            return res.status(403).json({ success: false, error: 'Incorrect current password.' });
        }
        
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE Customers SET password = ? WHERE customer_id = ?', [newHashedPassword, customerId]);
        res.json({ success: true, message: 'Password updated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update password.' });
    }
});

// Get customer's active rental
app.get('/api/customers/active-rental', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const sql = `
            SELECT r.*, c.make, c.model, c.year, c.daily_rate, DATEDIFF(CURDATE(), r.pickup_date) as days_rented
            FROM Rentals r JOIN Cars c ON r.car_id = c.car_id
            WHERE r.customer_id = ? AND r.return_date IS NULL`;
        const [rows] = await pool.query(sql, [customerId]);

        if (rows.length > 0) {
            const rental = rows[0];
            rental.estimated_cost = Math.max(1, (rental.days_rented || 0) + 1) * rental.daily_rate;
            res.json({ success: true, rental });
        } else {
            res.json({ success: true, rental: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// Get customer's rental history
app.get('/api/customers/rental-history', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(`
            SELECT r.rental_id, r.pickup_date, r.return_date, r.total_cost, c.make, c.model
            FROM Rentals r
            JOIN Cars c ON r.car_id = c.car_id
            WHERE r.customer_id = ?
            ORDER BY r.pickup_date DESC;
        `, [customerId]);
        res.json({ success: true, history: rows });
    } catch (err) {
        console.error("Error fetching rental history:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Check if customer can review a car
app.get('/api/customers/can-review/:carId', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { carId } = req.params;
        
        const [past] = await pool.query('SELECT 1 FROM Rentals WHERE customer_id = ? AND car_id = ? AND return_date IS NOT NULL', [customerId, carId]);
        const [active] = await pool.query('SELECT 1 FROM Rentals WHERE customer_id = ? AND car_id = ? AND return_date IS NULL', [customerId, carId]);
        const [reviewed] = await pool.query('SELECT 1 FROM Reviews WHERE customer_id = ? AND car_id = ?', [customerId, carId]);

        const canReview = (past.length > 0 || active.length > 0) && reviewed.length === 0;
        res.json({ success: true, canReview });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Submit a new review
app.post('/api/reviews', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { car_id, rating, review_text } = req.body;
    try {
        const sql = 'INSERT INTO Reviews (car_id, customer_id, rating, review_text) VALUES (?, ?, ?, ?)';
        await pool.query(sql, [car_id, customer_id, rating, review_text]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to submit review.' });
    }
});

// Update a review
app.put('/api/reviews/:reviewId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM Reviews WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to update this review.' });
        }
        
        const sql = 'UPDATE Reviews SET rating = ?, review_text = ? WHERE review_id = ?';
        await pool.query(sql, [rating, review_text, reviewId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update review.' });
    }
});

// Delete a review
app.delete('/api/reviews/:reviewId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { reviewId } = req.params;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM Reviews WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this review.' });
        }
        
        await pool.query('DELETE FROM Reviews WHERE review_id = ?', [reviewId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete review.' });
    }
});

// Get customer's favorite cars
app.get('/api/customers/favorites', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(`
            SELECT c.car_id, c.make, c.model, c.year
            FROM FavoriteCars f
            JOIN Cars c ON f.car_id = c.car_id
            WHERE f.customer_id = ?;
        `, [customerId]);
        res.json({ success: true, favorites: rows });
    } catch (err) {
        console.error("Error fetching favorites:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a car to favorites
app.post('/api/customers/favorites', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { car_id } = req.body;
        await pool.query('INSERT INTO FavoriteCars (customer_id, car_id) VALUES (?, ?)', [customerId, car_id]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add favorite.' });
    }
});

// Remove a car from favorites
app.delete('/api/customers/favorites/:car_id', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { car_id } = req.params;
        await pool.query('DELETE FROM FavoriteCars WHERE customer_id = ? AND car_id = ?', [customerId, car_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove favorite.' });
    }
});

// Get customer payment methods
app.get('/api/customers/payment-methods', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(
            'SELECT payment_method_id, card_type, masked_number FROM CustomerPaymentMethods WHERE customer_id = ?',
            [customerId]
        );
        res.json({ success: true, methods: rows });
    } catch (err) {
        console.error("Error fetching payment methods:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a payment method
app.post('/api/customers/payment-methods', authenticateCustomer, async (req, res) => {
    const customerId = req.user.id;
    // CRITICAL: Raw 'cardNumber' is removed. 
    // The frontend should send 'maskedNumber' and 'cardType' (e.g., from Stripe.js)
    const { cardHolderName, expiryDate, maskedNumber, cardType } = req.body;
    
    if (!cardHolderName || !expiryDate || !maskedNumber || !cardType) {
        return res.status(400).json({ success: false, error: 'Missing required payment details.' });
    }
    
    try {
        const sql = 'INSERT INTO CustomerPaymentMethods (customer_id, card_holder_name, card_type, masked_number, expiry_date) VALUES (?, ?, ?, ?, ?)';
        await pool.query(sql, [customerId, cardHolderName, cardType, maskedNumber, expiryDate]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to save payment method.' });
    }
});

// Delete a payment method
app.delete('/api/customers/payment-methods/:methodId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { methodId } = req.params;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM CustomerPaymentMethods WHERE payment_method_id = ?', [methodId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Payment method not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this method.' });
        }
        
        await pool.query('DELETE FROM CustomerPaymentMethods WHERE payment_method_id = ?', [methodId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete payment method.' });
    }
});


// --- ADMIN ROUTES ---

// All routes below this line are protected by the authenticateAdmin middleware
app.use('/api/admin', authenticateAdmin);

// Generic GET endpoint creator for simple tables
const createAdminGetEndpoint = (query, dataKey) => {
    return async (req, res) => {
        try {
            const [rows] = await pool.query(query);
            res.json({ success: true, [dataKey]: rows });
        } catch (error) {
            console.error(`Admin endpoint error for ${dataKey}:`, error);
            res.status(500).json({ success: false, error: 'A server error occurred.' });
        }
    };
};

// --- Admin: Get Data ---
// This is secure as it explicitly lists non-sensitive columns
app.get('/api/admin/employees', createAdminGetEndpoint('SELECT employee_id, first_name, last_name, job_title, hire_date, email, username FROM Employees', 'employees'));

app.get('/api/admin/rentals', createAdminGetEndpoint(`SELECT r.*, c.first_name, c.last_name, car.make, car.model FROM Rentals r JOIN Customers c ON r.customer_id = c.customer_id JOIN Cars car ON r.car_id = car.car_id ORDER BY r.pickup_date DESC`, 'rentals'));

// This is secure as it explicitly lists non-sensitive columns
app.get('/api/admin/customers', async (req, res) => {
    try {
        const sql = `
            SELECT customer_id, first_name, last_name, email, phone_number, address, city, state, zip_code
            FROM Customers ORDER BY last_name ASC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, customers: rows });
    } catch (error) {
        console.error('Admin Customers Fetch Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch customers.' });
    }
});

app.get('/api/admin/cars', async (req, res) => {
    try {
        const sql = `
            SELECT c.*, ct.type_name, GROUP_CONCAT(f.name) AS features
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            LEFT JOIN CarFeatures cf ON c.car_id = cf.car_id
            LEFT JOIN Features f ON cf.feature_id = f.feature_id
            GROUP BY c.car_id
            ORDER BY c.car_id ASC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, cars: rows });
    } catch (error) {
        console.error('Admin get cars error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});


// --- Admin: Car Management ---
app.post('/api/admin/cars', async (req, res) => {
    try {
        const { make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url } = req.body;
        const sql = `INSERT INTO Cars (make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url || null];
        const [result] = await pool.query(sql, params);
        res.status(201).json({ success: true, carId: result.insertId });
    } catch (error) {
        console.error('Create Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create car.' });
    }
});

app.put('/api/admin/cars/:id', async (req, res) => {
    try {
        const { make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url, next_service_due_date, next_service_details } = req.body;
        const sql = `UPDATE Cars SET make=?, model=?, year=?, license_plate=?, daily_rate=?, car_type_id=?, status=?, image_url=?, mileage=?, next_service_due_date=?, next_service_details=? WHERE car_id=?`;
        const params = [make, model, year, license_plate, daily_rate, car_type_id, status, image_url || null, mileage, next_service_due_date || null, next_service_details || null, req.params.id];
        await pool.query(sql, params);
        res.json({ success: true });
    } catch (error) {
        console.error('Update Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update car.' });
    }
});

app.delete('/api/admin/cars/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Cars WHERE car_id=?', [req.params.id]);
        res.json({ success: true, message: 'Car deleted.' });
    } catch (error) {
        console.error('Delete Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete car.' });
    }
});

// Update a car's features
app.post('/api/admin/cars/:carId/features', async (req, res) => {
    const { features } = req.body;
    const carId = req.params.carId;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (features && features.length > 0) {
            for (const feature of features) {
                await connection.query('INSERT IGNORE INTO Features (name) VALUES (?)', [feature]);
            }
        }

        await connection.query('DELETE FROM CarFeatures WHERE car_id = ?', [carId]);

        if (features && features.length > 0) {
            const [featureRows] = await connection.query('SELECT feature_id FROM Features WHERE name IN (?)', [features]);
            const featureValues = featureRows.map(f => [carId, f.feature_id]);
            if (featureValues.length > 0) {
                await connection.query('INSERT INTO CarFeatures (car_id, feature_id) VALUES ?', [featureValues]);
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Save Car Features Error:', error);
        res.status(500).json({ success: false, error: 'Failed to save car features.' });
    } finally {
        connection.release();
    }
});


// --- Admin: Employee Management ---
app.post('/api/admin/employees', async (req, res) => {
    try {
        const { first_name, last_name, job_title, email, username, password } = req.body;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const sql = 'INSERT INTO Employees (first_name, last_name, job_title, email, username, password) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [first_name, last_name, job_title, email, username, hashedPassword]);
        res.status(201).json({ success: true, employeeId: result.insertId });
    } catch (error) {
        console.error('Create Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create employee.' });
    }
});

app.put('/api/admin/employees/:id', async (req, res) => {
    try {
        const { first_name, last_name, job_title, email, username, password } = req.body;
        let query = 'UPDATE Employees SET first_name=?, last_name=?, job_title=?, email=?, username=?';
        const params = [first_name, last_name, job_title, email, username];

        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ', password=?';
            params.push(hashedPassword);
        }
        query += ' WHERE employee_id=?';
        params.push(req.params.id);

        await pool.query(query, params);
        res.json({ success: true, message: 'Employee updated.' });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update employee.' });
    }
});

app.delete('/api/admin/employees/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Employees WHERE employee_id=?', [req.params.id]);
        res.json({ success: true, message: 'Employee deleted.' });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete employee.' });
    }
});


// --- Admin: Customer Management ---
app.put('/api/admin/customers/:id', async (req, res) => {
    try {
        const { first_name, last_name, email, phone_number, address, city, state, zip_code } = req.body;
        const sql = 'UPDATE Customers SET first_name=?, last_name=?, email=?, phone_number=?, address=?, city=?, state=?, zip_code=? WHERE customer_id=?';
        const params = [first_name, last_name, email, phone_number, address, city, state, zip_code, req.params.id];
        await pool.query(sql, params);
        res.json({ success: true, message: 'Customer updated successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already in use by another customer.' });
        }
        console.error("Admin Update Customer Error:", error);
        res.status(500).json({ success: false, error: 'Failed to update customer profile.' });
    }
});

app.delete('/api/admin/customers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Customers WHERE customer_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Customer deleted successfully.' });
    } catch (error) {
        console.error('Delete Customer Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete customer. They may have existing rental records.' });
    }
});


// --- Admin: Rental & Maintenance Management ---
app.put('/api/admin/rentals/return/:rental_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rentalRows] = await connection.query('SELECT car_id FROM Rentals WHERE rental_id = ?', [req.params.rental_id]);
        if (rentalRows.length > 0) {
            await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [rentalRows[0].car_id]);
            await connection.query('UPDATE Rentals SET return_date = CURDATE() WHERE rental_id = ?', [req.params.rental_id]);
        } else {
            throw new Error('Rental not found.');
        }

        await connection.commit();
        res.json({ success: true, message: 'Return processed.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'DB transaction failed.' });
    } finally {
        connection.release();
    }
});

app.get('/api/admin/maintenance/active', async (req, res) => {
    try {
        const sql = `
            SELECT m.maintenance_id, m.service_date, m.service_type, m.notes, m.cost,
                   c.car_id, c.make, c.model, c.license_plate
            FROM Maintenance m JOIN Cars c ON m.car_id = c.car_id
            WHERE m.completion_date IS NULL ORDER BY m.service_date DESC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, active_maintenance: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});

app.get('/api/admin/maintenance/history/:carId', async (req, res) => {
    try {
        const sql = 'SELECT * FROM Maintenance WHERE car_id = ? ORDER BY service_date DESC';
        const [rows] = await pool.query(sql, [req.params.carId]);
        res.json({ success: true, history: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});

app.post('/api/admin/maintenance', async (req, res) => {
    const { car_id, service_date, service_type, cost, notes, mileage_at_service } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const sql = 'INSERT INTO Maintenance (car_id, service_date, service_type, cost, notes, completion_date) VALUES (?, ?, ?, ?, ?, NULL)';
        await connection.query(sql, [car_id, service_date, service_type, cost || null, notes || null]);
        await connection.query("UPDATE Cars SET status = 'Maintenance', mileage = ? WHERE car_id = ?", [mileage_at_service, car_id]);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Maintenance scheduled.' });
    } catch (error) {
        console.error('MAINTENANCE SUBMISSION ERROR:', error);
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Database transaction failed.' });
    } finally {
        connection.release();
    }
});

app.put('/api/admin/maintenance/complete/:maintenance_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [maintRows] = await connection.query('SELECT car_id FROM Maintenance WHERE maintenance_id = ?', [req.params.maintenance_id]);
        if (maintRows.length === 0) throw new Error('Maintenance record not found.');
        const carId = maintRows[0].car_id;

        await connection.query("UPDATE Maintenance SET completion_date = CURDATE() WHERE maintenance_id = ?", [req.params.maintenance_id]);
        await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [carId]);

        await connection.commit();
        res.json({ success: true, message: 'Car has been returned to service.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'DB transaction failed.' });
    } finally {
        connection.release();
    }
});

app.put('/api/admin/maintenance/:maintenance_id', async (req, res) => {
    try {
        const { cost, notes } = req.body;
        await pool.query('UPDATE Maintenance SET cost = ?, notes = ? WHERE maintenance_id = ?', [cost, notes, req.params.maintenance_id]);
        res.json({ success: true, message: 'Maintenance record updated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});


// --- Admin: Dashboard & Metrics ---
app.get('/api/admin/dashboard/metrics', async (req, res) => {
    try {
        const [carStatusRows] = await pool.query(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
                   SUM(CASE WHEN status = 'Rented' THEN 1 ELSE 0 END) as rented,
                   SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
            FROM Cars`);
        const [revenueRows] = await pool.query(`SELECT SUM(total_cost) as totalRevenue FROM Rentals WHERE return_date IS NOT NULL`);

        const carStatus = carStatusRows[0] || { total: 0, available: 0, rented: 0, maintenance: 0 };
        const revenue = revenueRows[0] || { totalRevenue: 0 };
        res.json({ success: true, metrics: { carStatus, revenue } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'DB query failed' });
    }
});

app.get('/api/admin/metrics/revenue-by-month', async (req, res) => {
    try {
        const sql = `
            SELECT DATE_FORMAT(return_date, '%Y-%m') as month, SUM(total_cost) as revenue
            FROM Rentals WHERE return_date IS NOT NULL
            GROUP BY month ORDER BY month ASC LIMIT 12`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/admin/metrics/popular-car-types', async (req, res) => {
    try {
        const sql = `
            SELECT ct.type_name, COUNT(r.rental_id) as rental_count
            FROM Rentals r
            JOIN Cars c ON r.car_id = c.car_id
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            GROUP BY ct.type_name ORDER BY rental_count DESC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`API Server is running successfully on http://localhost:${PORT}`);
});
