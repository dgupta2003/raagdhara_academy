'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Footer from '@/components/common/Footer';

const NotFound = () => {
    const router = useRouter();

    const handleGoHome = () => {
        router?.push('/');
    };

    const handleGoBack = () => {
        if (typeof window !== 'undefined') {
            window.history?.back();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="flex justify-center mb-6">
                        <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
                    </div>

                    <h2 className="text-2xl font-medium text-onBackground mb-2">Page Not Found</h2>
                    <p className="text-onBackground/70 mb-8">
                        The page you're looking for doesn't exist. Let's get you back!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGoBack}
                            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
                        >
                            <Icon name="ArrowLeftIcon" size={16} />
                            Go Back
                        </button>

                        <button
                            onClick={handleGoHome}
                            className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                        >
                            <Icon name="HomeIcon" size={16} />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default NotFound;