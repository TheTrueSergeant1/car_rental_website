const bcrypt = require('bcrypt');

/**
 * =================================================================
 * Admin Password Hash Generator
 * =================================================================
 * Run this script ONCE to generate a secure password hash for your
 * default admin account.
 *
 * How to use:
 * 1. Change the `myPassword` variable below to your desired password.
 * 2. Run this file from your terminal: node hash-admin.js
 * 3. Copy the ENTIRE hash string that it prints out.
 * 4. Paste that hash into the `password` column in your 'Employees'
 * database table for your admin user.
 * =================================================================
 */

async function generateHash() {
    // --- STEP 1: SET YOUR ADMIN PASSWORD HERE ---
    const myPassword = 'user'; // Change this to your desired password
    // ------------------------------------------

    if (myPassword === 'user') {
        console.warn('Warning: You are using the default password "user".');
        console.warn('This is fine for testing, but please change it before deploying!\n');
    }

    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(myPassword, saltRounds);

        console.log('--- Admin Password Hash Generator ---');
        console.log(`Password to hash: ${myPassword}`);
        console.log('\nSUCCESS! Here is your bcrypt hash:\n');
        
        // This is the string you will copy
        console.log(hash); 
        
        console.log('\nCopy the entire hash (starting with $2b$...) and paste it into the `password` column in your `Employees` table.');

    } catch (err) {
        console.error('Error generating hash:', err);
    }
}

generateHash();
