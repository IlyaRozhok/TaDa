"use client";

import React, { useState, useEffect } from "react";

const CookieNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    // Проверяем, согласился ли пользователь с cookies ранее
    const cookieConsent = localStorage.getItem("cookieConsent");

    if (!cookieConsent) {
      // Небольшая задержка перед показом для плавности
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setIsHiding(true);
    // Ждем окончания анимации перед скрытием
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("cookieConsent", "true");
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
      fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6
      transition-transform duration-300 ease-out
      ${isHiding ? "translate-y-full" : "translate-y-0"}
    `}
    >
      <div className="relative max-w-4xl w-full">
        <div
          className={`
          relative overflow-hidden p-1
          bg-gradient-to-br from-white/80 via-white/90 to-white/80
          backdrop-blur-xl border-t border-white/20
          shadow-[0_-8px_25px_-4px_rgba(0,0,0,0.1)] rounded-2xl
          animate-slideUp
        `}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-violet-50/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.blue.50/0.2),transparent_50%)]" />
          </div>

          <div className="relative flex items-center gap-8 p-6">
            <div className="flex-shrink-0 hidden sm:block">
              <div className="w-[3px] h-12 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full" />
            </div>

            <div className="flex-grow">
              <h2 className="text-lg font-medium text-gray-900 tracking-tight mb-1.5">
                Privacy Notice
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
                We use cookies to enhance your browsing experience, analyze site
                traffic, and provide personalized content. By continuing to use
                our website, you consent to our Privacy Policy and the use of
                cookies.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAccept}
                className="
                  px-6 py-2.5 text-sm font-medium cursor-pointer
                  bg-gradient-to-br from-slate-800 to-slate-900 
                  hover:from-violet-500 hover:to-pink-600
                  text-white rounded-lg shadow-sm
                  transition-all duration-200 ease-out
                  hover:shadow-md hover:shadow-blue-500/10
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  active:scale-[0.98]
                "
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieNotification;
