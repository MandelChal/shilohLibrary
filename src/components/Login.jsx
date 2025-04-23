import React, { useState } from 'react';
import { auth } from '../firebase'; // Adjust the import based on your file structure
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user);
            alert('Login successful!');
        } catch (error) {
            console.error('Login failed:', error.message);
            alert('Login failed: ' + error.message);
        }
    };

    const handleForgotPassword = async () => {

        if (!email) {
            alert('Please enter your email to reset your password.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            console.log('Password reset email sent.');
            alert('Password reset email sent. Please check your inbox.');
        } catch (error) {
            console.error('Failed to send password reset email:', error.message);
            alert('Failed to send password reset email: ' + error.message);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <button onClick={handleForgotPassword}>Forgot Password?</button>
        </div>
    );
};

export default Login;