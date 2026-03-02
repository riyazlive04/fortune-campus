import React from 'react';
import { format } from 'date-fns';
import { Building2, User, CreditCard, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';

interface FeeReceiptProps {
    data: {
        id: string;
        amount: number;
        paymentMode: string;
        transactionId?: string;
        createdAt: string;
        status: string;
        student: {
            user: {
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
            };
            enrollmentNumber: string;
        };
        admission: {
            course: {
                name: string;
            };
            feeAmount: number;
            feePaid: number;
            feeBalance: number;
        };
        branch: {
            name: string;
            address?: string;
            city?: string;
            phone?: string;
        };
        approvedBy?: {
            firstName: string;
            lastName: string;
        };
    };
}

const FeeReceipt: React.FC<FeeReceiptProps> = ({ data }) => {
    const { student, admission, branch, approvedBy } = data;
    const fullName = `${student.user.firstName} ${student.user.lastName}`;
    const approverName = approvedBy ? `${approvedBy.firstName} ${approvedBy.lastName}` : 'System Admin';

    return (
        <div id="fee-receipt-content" className="w-[800px] p-10 bg-white text-slate-800 font-sans shadow-2xl mx-auto border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary/20 pb-8 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">FORTUNE CAMPUS</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Excellence in Innovation</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                        <CheckCircle2 className="w-3 h-3" /> Official Payment Receipt
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Receipt No: <span className="font-bold text-slate-900">{data.id.substring(0, 8).toUpperCase()}</span></p>
                    <p className="text-xs text-slate-500 font-medium">Date: <span className="font-bold text-slate-900">{format(new Date(data.createdAt), 'dd MMM yyyy')}</span></p>
                </div>
            </div>

            {/* Main Content Info Grid */}
            <div className="grid grid-cols-2 gap-10 mb-10">
                {/* Student Info */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" /> Student Details
                    </h3>
                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 italic-style">
                        <p className="text-lg font-bold text-slate-900 mb-1">{fullName}</p>
                        <p className="text-sm font-medium text-slate-600 mb-1">ID: <span className="text-slate-900">{student.enrollmentNumber}</span></p>
                        <p className="text-sm font-medium text-slate-600 mb-1">Course: <span className="text-slate-900">{admission.course.name}</span></p>
                        <p className="text-xs text-slate-500 mt-2">{student.user.email} | {student.user.phone}</p>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="space-y-4 text-right">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-end">
                        <CreditCard className="w-3 h-3" /> Payment Info
                    </h3>
                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                        <p className="text-3xl font-black text-primary mb-1">₹{data.amount.toLocaleString()}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase">Paid via {data.paymentMode}</p>
                        {data.transactionId && (
                            <p className="text-[10px] text-slate-400 mt-1 italic">Txn: {data.transactionId}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Ledger Section */}
            <div className="mb-10">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-bold text-slate-800 underline decoration-primary/30 decoration-2 underline-offset-4">Installment Payment</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Fee payment for course: {admission.course.name} at {branch.name} branch.</p>
                            </td>
                            <td className="py-4 text-right align-top">
                                <span className="font-black text-slate-900">₹{data.amount.toLocaleString()}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Fee Breakdown Card */}
            <div className="flex justify-end mb-12">
                <div className="w-72 space-y-3 bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                    {/* Decorative background circle */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors"></div>

                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                        <span className="text-white/60 font-medium">Total Course Fee</span>
                        <span className="font-bold">₹{admission.feeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                        <span className="text-white/60 font-medium">Paid To Date</span>
                        <span className="font-bold">₹{admission.feePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg pt-1">
                        <span className="text-primary font-black">Due Balance</span>
                        <span className="font-black">₹{admission.feeBalance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Authority Sign */}
            <div className="flex justify-between items-end pt-8 border-t border-slate-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        <div className="text-[10px] leading-tight">
                            <p className="font-bold text-slate-600 uppercase">Electronically Verified</p>
                            <p>This is a computer generated document.</p>
                            <p>No physical signature required.</p>
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-400">
                        <p className="font-bold">{branch.name} Campus</p>
                        <p>{branch.address}, {branch.city}</p>
                        <p>Contact: {branch.phone}</p>
                    </div>
                </div>
                <div className="text-center w-48">
                    <div className="mb-4 border-b border-slate-300 pb-2 italic text-sm font-semibold text-slate-700 font-serif">
                        {approverName}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Approver</p>
                </div>
            </div>

            {/* Branding Stripe */}
            <div className="mt-10 h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-600 rounded-full opacity-30"></div>
        </div>
    );
};

export default FeeReceipt;
