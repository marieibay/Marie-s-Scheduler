import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export const SetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password updated successfully! You will be redirected to the dashboard shortly.");
            // After success, clean the URL hash and reload the page.
            // App.tsx will then see a valid session but no access token, and will render the dashboard.
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                window.location.reload();
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Set Your Password</h1>
                    <p className="mt-2 text-sm text-gray-600">You've accepted the invitation. Please create a password to secure your account.</p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">{message}</div>}

                <form className="space-y-6" onSubmit={handlePasswordUpdate}>
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-bold text-gray-700 tracking-wide"
                        >
                            New Password
                        </label>
                        <input
                            id="password"
                            className="w-full text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
                            type="password"
                            placeholder="Enter your new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center bg-indigo-600 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-indigo-700 shadow-lg cursor-pointer transition ease-in duration-300 disabled:bg-indigo-400"
                            disabled={loading || !!message}
                        >
                            {loading ? 'Saving...' : 'Set Password and Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
