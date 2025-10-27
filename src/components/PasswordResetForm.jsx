import React, { useState, useEffect } from 'react';

export default function PasswordResetForm() {
    const [view, setView] = useState('request'); // request, reset
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        const urlToken = new URLSearchParams(window.location.search).get('token');
        if (urlToken) {
            setToken(urlToken);
            setView('reset');
        }
    }, []);

    const handleRequest = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3001/api/customers/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: e.target.email.value })
        });
        const data = await res.json();
        // For simulation, we'll get the token and move to the next step
        if (data.success && data.token) {
            setToken(data.token);
            setMessage('Token generated. Please check server console and enter it below to simulate email link.');
            setView('reset');
        } else {
            setMessage(data.message);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;
        if(newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const res = await fetch('http://localhost:3001/api/customers/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        if(data.success) {
            setMessage('Password reset successfully! You can now log in.');
            setTimeout(() => window.location.href = '/login', 3000);
        } else {
            setError(data.error);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
             <h1 className="text-3xl font-bold text-center mb-6">Password Reset</h1>
             {message && <p className="text-green-500 text-center mb-4">{message}</p>}
             {error && <p className="text-red-500 text-center mb-4">{error}</p>}

             {view === 'request' && (
                <form onSubmit={handleRequest} className="space-y-4">
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                    <input type="email" name="email" placeholder="Your Email" required className="w-full p-2 border rounded" />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Send Reset Link</button>
                </form>
             )}
             {view === 'reset' && (
                <form onSubmit={handleReset} className="space-y-4">
                     <p>A new password has been requested for your account. Please enter and confirm your new password below.</p>
                     <input type="password" name="newPassword" placeholder="New Password" required className="w-full p-2 border rounded" />
                     <input type="password" name="confirmPassword" placeholder="Confirm New Password" required className="w-full p-2 border rounded" />
                     <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Reset Password</button>
                </form>
             )}
        </div>
    );
}