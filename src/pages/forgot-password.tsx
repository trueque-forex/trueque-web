import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for password reset would go here
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col relative overflow-hidden">
            <Head>
                <title>Forgot Password - Symmetri</title>
            </Head>

            {/* Decorative Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#1A73E8]/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Navigation */}
            <nav className="absolute top-0 left-0 p-8 z-50">
                <Link href="/signin" className="text-gray-500 hover:text-black transition-colors flex items-center gap-2 font-medium">
                    ← Back to Sign In
                </Link>
            </nav>

            <main className="flex-grow flex items-center justify-center p-6">
                <div className="w-full max-w-md">

                    <div className="text-center mb-10">
                        <Link href="/" className="text-4xl font-bold tracking-tighter text-gray-900 block mb-2">
                            Symmetri
                        </Link>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl p-8 md:p-10">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
                                    <p className="text-gray-500 text-sm mt-2">Enter your email and we'll send you a link to reset your password.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    Send Reset Link
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                                <p className="text-gray-500 mb-6">If an account exists for {email}, we have sent a password reset link.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-[#1A73E8] font-bold hover:underline"
                                >
                                    Try another email
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
