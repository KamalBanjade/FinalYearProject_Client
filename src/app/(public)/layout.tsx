'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                            MR
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">MedRecord</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">About</Link>
                        <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
                        <Link href="/login" className="px-4 py-2 text-sm font-bold text-indigo-600 border border-indigo-200 rounded-full hover:bg-slate-50 transition-all">Sign In</Link>
                        <Link href="/register" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-md transition-all">Get Started</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2">
                            <span className="text-white font-bold text-xl mb-4 block">MedRecord</span>
                            <p className="max-w-xs text-sm">
                                Secure, decentralized, and accessible medical records management system for modern healthcare.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Help</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center text-xs">
                        © {new Date().getFullYear()} Medical Record System. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
