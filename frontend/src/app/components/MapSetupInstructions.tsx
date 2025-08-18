"use client";

import React from "react";

export default function MapSetupInstructions() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-yellow-800">
          Google Maps API не активирован
        </h3>
      </div>

      <p className="text-yellow-700 mb-4">
        Ошибка{" "}
        <code className="bg-yellow-100 px-1 rounded">
          ApiNotActivatedMapError
        </code>{" "}
        означает, что Google Maps JavaScript API не активирован в вашем проекте
        Google Cloud.
      </p>

      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-3">Как исправить:</h4>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Перейдите в Google Cloud Console
              </p>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                console.cloud.google.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Выберите ваш проект
              </p>
              <p className="text-xs text-gray-500">
                Или создайте новый, если у вас его нет
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Перейдите в "APIs & Services" → "Library"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">4</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Найдите "Maps JavaScript API"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">5</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Нажмите "Enable"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2">Важно:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • API ключ должен быть в проекте, где активирован Maps JavaScript
            API
          </li>
          <li>
            • После активации API может потребоваться несколько минут для
            распространения
          </li>
          <li>• Убедитесь, что у вас включен биллинг в Google Cloud</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
        <a
          href="https://console.cloud.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Открыть Google Cloud Console
        </a>
      </div>
    </div>
  );
}
