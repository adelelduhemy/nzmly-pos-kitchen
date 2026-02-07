import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

const Unauthorized = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isRTL = i18n.language === 'ar';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldX className="h-10 w-10 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900">
                    {isRTL ? 'غير مصرح لك' : 'Access Denied'}
                </h1>

                <p className="text-gray-600">
                    {isRTL
                        ? 'عذرًا، ليس لديك الصلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول للحصول على إذن.'
                        : 'Sorry, you do not have permission to access this page. Please contact your administrator.'}
                </p>

                {user && (
                    <div className="bg-gray-100 p-3 rounded text-sm text-gray-500">
                        {isRTL ? 'تم تسجيل الدخول بصفتك:' : 'Logged in as:'} <strong>{user.email}</strong>
                    </div>
                )}

                <Button
                    onClick={() => navigate('/')}
                    className="w-full gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة إلى الرئيسية' : 'Back to Home'}
                </Button>
            </div>
        </div>
    );
};

export default Unauthorized;
