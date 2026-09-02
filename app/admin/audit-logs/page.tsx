import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, Lock, Activity, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const logsRes = await getAuditLogs(1, 50);

  const getActionColor = (action: string) => {
    if (action.includes("APPROVE") || action.includes("CREDIT")) return "text-green-400 bg-green-500/10 border-green-500/30";
    if (action.includes("REJECT") || action.includes("DELETE") || action.includes("BAN")) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (action.includes("REFUND")) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-orange-500 bg-orange-500/10 border-orange-500/30";
  };

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Tamper-Proof Audit Vault
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          سجل العمليات والرقابة الإدارية (Audit Logs)
        </h1>
        <p className="text-xs text-gray-400">
          توثيق كامل لكافة التعديلات الإدارية الحساسة، العمليات المالية، وتغييرات الأسعار والمحافظ.
        </p>
      </div>

      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        {logsRes.logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد سجلات مسجلة حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-garage-950/60 text-gray-400 font-bold">
                  <th className="p-4">نوع الإجراء (Action)</th>
                  <th className="p-4">المسؤول (Admin)</th>
                  <th className="p-4">الهدف (Target)</th>
                  <th className="p-4">بيانات التعديل (Diff / Payload)</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {logsRes.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a202c]/50 transition">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-white font-sans text-xs">
                      {log.adminEmail || "System Engine"}
                    </td>
                    <td className="p-4 text-cyan-300">
                      {log.targetType} {log.targetId && `#${log.targetId.substring(0, 8)}`}
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="space-y-1 text-[10px] bg-garage-950 p-2 rounded-lg border border-gray-800 break-all text-gray-300">
                        {log.beforeValue && (
                          <div className="text-red-300 font-mono">Before: {log.beforeValue}</div>
                        )}
                        {log.afterValue && (
                          <div className="text-green-300 font-mono">After: {log.afterValue}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[10px] text-gray-400">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
