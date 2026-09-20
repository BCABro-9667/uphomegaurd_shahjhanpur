import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const WHATSAPP_LINK = 'https://chat.whatsapp.com/FXqyxvVrt8XGcylF4wOtyK';

  return (
    <div
      id="whatsapp-floating-container"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center group select-none"
    >
      {/* Tooltip on hover / desktop */}
      <div className="hidden md:flex items-center mr-3 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg border border-slate-700/50 opacity-90 group-hover:opacity-100 transition-all pointer-events-none transform group-hover:-translate-x-1">
        <span>व्हाट्सएप ग्रुप से जुड़ें (Join Group)</span>
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45 border-r border-t border-slate-700/50"></div>
      </div>

      {/* Main WhatsApp Button */}
      <a
        id="btn-whatsapp-join"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join UP Home Guard Shahjahanpur WhatsApp Group"
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Pulsing ring animation */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-35 animate-ping -z-10"></span>
        
        {/* SVG WhatsApp Official Icon */}
        <svg
          className="w-7 h-7 fill-current drop-shadow-xs"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.782-.878-2.057-.978-.276-.1-.476-.15-.677.15-.201.3-.777.978-.952 1.179-.175.2-.351.226-.652.075s-1.272-.469-2.423-1.496c-.896-.798-1.501-1.784-1.677-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.051-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.587-.492-.507-.677-.517-.175-.009-.376-.011-.577-.011s-.527.075-.803.376c-.276.301-1.053 1.028-1.053 2.508s1.079 2.909 1.229 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.379.198 1.9.12.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zM12.04 2C6.502 2 2 6.502 2 12.04c0 1.954.558 3.778 1.523 5.323L2.2 22l4.821-1.264a9.99 9.99 0 0 0 5.019 1.344h.004c5.537 0 10.04-4.502 10.04-10.04C22.084 6.502 17.581 2 12.04 2zm0 18.257h-.003a8.21 8.21 0 0 1-4.188-1.147l-.3-.178-3.111.816.83-3.033-.195-.311a8.196 8.196 0 0 1-1.258-4.364c0-4.542 3.696-8.238 8.24-8.238 2.2 0 4.269.858 5.823 2.414a8.19 8.19 0 0 1 2.41 5.824c0 4.543-3.696 8.24-8.243 8.24z" />
        </svg>

        {/* Small badge count/dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full"></span>
      </a>
    </div>
  );
};
