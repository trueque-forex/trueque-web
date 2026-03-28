import Link from 'next/link';
import Head from 'next/head';

export default function About() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col overflow-hidden">
            <Head>
                <title>How it Works - Symmetri</title>
            </Head>

            {/* Navigation - Absolute to save space */}
            <nav className="absolute top-0 left-0 p-8 z-50">
                <Link href="/" className="text-[#1A73E8] hover:text-black transition-colors flex items-center gap-2 font-medium">
                    ← Back to Home
                </Link>
            </nav>

            {/* Main Content - Full Height Flex Center */}
            <main className="flex-grow flex items-center justify-center p-6 md:p-12 h-screen">
                <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* LEFT COLUMN: Narrative & Logic */}
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
                            How it Works
                        </h1>

                        <div className="space-y-6 text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                            <p className="font-normal text-gray-800">
                                Symmetri is an application that allows users in different countries to exchange their currencies at the market rate. You can use it for sending money home, to your loved ones or for travelers buying currencies of their countries destination.
                            </p>
                            <div className="space-y-4 pl-4 border-l-2 border-[#1A73E8]/30">
                                <p>
                                    In Symmetri a user A in one country has the opportunity to swap her domestic currency for the domestic currency of another user B in a different country.
                                </p>
                                <p>
                                    Currency submitted by user A is directed to a beneficiary, designated by user B, inside A’s country, and currency submitted by user B is directed to a beneficiary, designated by user A, inside B’s country.
                                </p>
                            </div>
                            <p>
                                Swapped currencies can be submitted to a recipient bank account, to a debit card or to a recipient digital wallet.
                            </p>
                        </div>

                        <div className="mt-12">
                            <Link
                                href="/signin"
                                className="inline-block px-10 py-4 bg-[#1A73E8] text-white font-bold text-lg rounded-xl hover:bg-[#357ABD] transition-colors shadow-lg shadow-[#1A73E8]/20 hover:shadow-[#1A73E8]/40 transform hover:-translate-y-1"
                            >
                                Start Swapping Now
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Visual Diagram */}
                    <div className="relative w-full h-full flex flex-col justify-center">
                        {/* Diagram Container */}
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 relative overflow-hidden shadow-sm aspect-video flex items-center justify-center">

                            {/* Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#1A73E8]/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="grid grid-cols-2 gap-8 md:gap-16 relative z-10 w-full max-w-lg">

                                {/* COUNTRY A */}
                                <div className="flex flex-col items-center">
                                    <div className="mb-4 text-[#1A73E8] font-bold tracking-widest text-sm uppercase">Country A</div>
                                    <div className="w-full bg-white rounded-2xl p-6 border border-gray-200 flex flex-col items-center gap-4 shadow-sm relative group hover:border-[#1A73E8]/30 transition-colors">
                                        {/* User A */}
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-12 h-12 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-bold text-xl shadow-md">A</div>
                                            <div className="text-sm font-bold text-gray-900">User A</div>
                                        </div>

                                        {/* Flow Line */}
                                        <div className="h-12 w-0.5 bg-gradient-to-b from-gray-300 to-[#1A73E8]"></div>

                                        {/* Beneficiary B */}
                                        <div className="flex items-center gap-3 w-full justify-end opacity-90">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">Beneficiary B</div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Desig. by User B</div>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 font-bold text-lg">B</div>
                                        </div>
                                    </div>
                                </div>

                                {/* COUNTRY B */}
                                <div className="flex flex-col items-center">
                                    <div className="mb-4 text-[#1A73E8] font-bold tracking-widest text-sm uppercase">Country B</div>
                                    <div className="w-full bg-white rounded-2xl p-6 border border-gray-200 flex flex-col items-center gap-4 shadow-sm relative group hover:border-[#1A73E8]/30 transition-colors">
                                        {/* User B */}
                                        <div className="flex items-center gap-3 w-full justify-end">
                                            <div className="text-sm font-bold text-gray-900">User B</div>
                                            <div className="w-12 h-12 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-bold text-xl shadow-md">B</div>
                                        </div>

                                        {/* Flow Line */}
                                        <div className="h-12 w-0.5 bg-gradient-to-b from-gray-300 to-[#1A73E8]"></div>

                                        {/* Beneficiary A */}
                                        <div className="flex items-center gap-3 w-full opacity-90">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 font-bold text-lg">A</div>
                                            <div className="text-left">
                                                <div className="text-sm font-bold text-gray-900">Beneficiary A</div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Desig. by User A</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* THE SWAP SYMBOL (Center) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-16 h-16 bg-white rounded-full border border-gray-200 z-20 shadow-lg text-[#1A73E8]">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7.16016 13L12.5002 18L17.8402 13" />
                                    <path d="M7.16016 11L12.5002 6L17.8402 11" />
                                </svg>
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-400 mt-6 max-w-md mx-auto italic">
                            Money never crosses borders. Value is teleported locally.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
