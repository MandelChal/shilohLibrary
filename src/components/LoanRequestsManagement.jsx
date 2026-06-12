// src/components/LoanRequestsManagement.jsx
import React, { useState, useEffect } from 'react';
import { Book, RefreshCw } from 'lucide-react';
import {
    getLoanRequests,
    updateLoanRequestStatus,
    deleteLoanRequest,
    updateBook
} from '../utils/dbHelpers';

const LoanRequestsManagement = ({ currentUser }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const requestsData = await getLoanRequests();
            setRequests(requestsData);
            console.log('בקשות השאלה נטענו:', requestsData.length);
        } catch (error) {
            console.error('שגיאה בטעינת בקשות:', error);
            alert('שגיאה בטעינת הבקשות: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, newStatus, bookId = null) => {
        setLoading(true);
        try {
            // עדכון סטטוס הבקשה
            await updateLoanRequestStatus(requestId, newStatus, adminNotes);

            // אם מאשרים - עדכון סטטוס הספר למושאל
            if (newStatus === 'approved' && bookId) {
                await updateBook(bookId, {
                    status: 'borrowed',
                    borrowedBy: requests.find(r => r.id === requestId)?.requesterName,
                    borrowDate: new Date().toISOString()
                });
            }

            // אם מחזירים ספר - עדכון חזרה לזמין
            if (newStatus === 'returned' && bookId) {
                await updateBook(bookId, {
                    status: 'available',
                    borrowedBy: null,
                    borrowDate: null,
                    returnDate: new Date().toISOString()
                });
            }

            // עדכון רשימת הבקשות
            setRequests(prev => prev.map(req =>
                req.id === requestId
                    ? { ...req, status: newStatus, adminNotes, updatedAt: new Date().toISOString() }
                    : req
            ));

            setSelectedRequest(null);
            setAdminNotes('');
            console.log(`בקשה ${requestId} עודכנה לסטטוס: ${newStatus}`);

        } catch (error) {
            console.error('שגיאה בעדכון בקשה:', error);
            alert('שגיאה בעדכון הבקשה: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את הבקשה?')) {
            setLoading(true);
            try {
                await deleteLoanRequest(requestId);
                setRequests(prev => prev.filter(req => req.id !== requestId));
                console.log('בקשה נמחקה:', requestId);
            } catch (error) {
                console.error('שגיאה במחיקת בקשה:', error);
                alert('שגיאה במחיקת הבקשה: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'approved': return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            case 'returned': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'ממתין לאישור';
            case 'approved': return 'אושר - מושאל';
            case 'rejected': return 'נדחה';
            case 'returned': return 'הוחזר';
            default: return 'לא ידוע';
        }
    };

    const pendingRequests = requests.filter(req => req.status === 'pending');
    const approvedRequests = requests.filter(req => req.status === 'approved');

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Book className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold">ניהול בקשות השאלה</h2>
                        {loading && <div className="text-sm text-blue-600">טוען...</div>}
                    </div>
                    <button
                        onClick={loadRequests}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className="w-4 h-4" />
                        רענן
                    </button>
                </div>

                {/* סטטיסטיקות */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-900">{pendingRequests.length}</div>
                        <div className="text-sm text-yellow-700">ממתינות לאישור</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-900">{approvedRequests.length}</div>
                        <div className="text-sm text-green-700">מושאלים כעת</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">{requests.length}</div>
                        <div className="text-sm text-blue-700">סה״כ בקשות</div>
                    </div>
                </div>
            </div>

            {/* בקשות ממתינות */}
            {pendingRequests.length > 0 && (
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">בקשות ממתינות לאישור</h3>
                    <div className="space-y-3">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-white rounded-xl p-4 border border-yellow-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-lg">{request.bookTitle}</h4>
                                            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(request.status)}`}>
                                                {getStatusText(request.status)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div><strong>מבקש:</strong> {request.requesterName}</div>
                                            <div><strong>טלפון:</strong> {request.contactPhone}</div>
                                            {request.expectedReturnDate && (
                                                <div><strong>תאריך החזרה משוער:</strong> {new Date(request.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                                            )}
                                            {request.notes && (
                                                <div><strong>הערות:</strong> {request.notes}</div>
                                            )}
                                            <div><strong>תאריך בקשה:</strong> {new Date(request.createdAt).toLocaleDateString('he-IL')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedRequest(request)}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            disabled={loading}
                                        >
                                            טפל בבקשה
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ספרים מושאלים כעת */}
            {approvedRequests.length > 0 && (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">ספרים מושאלים כעת</h3>
                    <div className="space-y-3">
                        {approvedRequests.map(request => (
                            <div key={request.id} className="bg-white rounded-xl p-4 border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-lg">{request.bookTitle}</h4>
                                            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(request.status)}`}>
                                                {getStatusText(request.status)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div><strong>שואל:</strong> {request.requesterName} • {request.contactPhone}</div>
                                            <div><strong>תאריך אישור:</strong> {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString('he-IL') : 'לא ידוע'}</div>
                                            {request.expectedReturnDate && (
                                                <div><strong>החזרה משוערת:</strong> {new Date(request.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus(request.id, 'returned', request.bookId)}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            disabled={loading}
                                        >
                                            סמן כהוחזר
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* חלון טיפול בבקשה */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold mb-4">טיפול בבקשת השאלה</h3>

                            <div className="space-y-3 mb-6">
                                <div><strong>ספר:</strong> {selectedRequest.bookTitle}</div>
                                <div><strong>מבקש:</strong> {selectedRequest.requesterName}</div>
                                <div><strong>טלפון:</strong> {selectedRequest.contactPhone}</div>
                                {selectedRequest.expectedReturnDate && (
                                    <div><strong>החזרה משוערת:</strong> {new Date(selectedRequest.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                                )}
                                {selectedRequest.notes && (
                                    <div><strong>הערות המבקש:</strong> {selectedRequest.notes}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">הערות אדמין (אופציונלי)</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="הערות לבקשה..."
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved', selectedRequest.bookId)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? 'מעדכן...' : 'אשר השאלה'}
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'מעדכן...' : 'דחה בקשה'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setAdminNotes('');
                                    }}
                                    disabled={loading}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanRequestsManagement;