import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div
      id="disclaimer-banner"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong className="uppercase tracking-wider font-bold">DEMO BANK • VIRTUAL MONEY ONLY • NOT A REAL BANK:</strong>{' '}
            Hệ thống ngân hàng mô phỏng tiền ảo phục vụ thử nghiệm. Không sử dụng tiền thật hay liên kết ngân hàng thực tế.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Môi trường thử nghiệm an toàn (Sandbox)</span>
        </div>
      </div>
    </div>
  );
};
