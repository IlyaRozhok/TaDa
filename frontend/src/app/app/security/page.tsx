"use client";

import { useAppSelector } from "../../store/hooks";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

import {
  Shield,
  ArrowLeft,
  Key,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { AuthActivityLog, CompactAuthLog } from "../../components/AuthLogRenderer";

export default function SecurityPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/app/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href={
                  user.roles?.includes("operator")
                    ? "/app/dashboard/operator"
                    : "/app/dashboard/tenant"
                }
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Назад к панели
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Безопасность
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Security Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Обзор безопасности
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Key className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Токены</p>
                    <p className="text-sm text-green-600">Автообновление</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Сессии</p>
                    <p className="text-sm text-blue-600">Управляемые</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-800">
                      Активность
                    </p>
                    <p className="text-sm text-purple-600">Отслеживается</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-800">
                      Защита
                    </p>
                    <p className="text-sm text-orange-600">Активна</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Функции безопасности
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Автоматическое обновление токенов
                  </p>
                  <p className="text-sm text-gray-600">
                    Access токены обновляются каждые 15 минут для максимальной
                    безопасности
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Device fingerprinting
                  </p>
                  <p className="text-sm text-gray-600">
                    Каждая сессия привязана к устройству для предотвращения
                    несанкционированного доступа
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    HttpOnly cookies
                  </p>
                  <p className="text-sm text-gray-600">
                    Refresh токены хранятся в защищенных httpOnly cookies,
                    недоступных для JavaScript
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Отслеживание активности
                  </p>
                  <p className="text-sm text-gray-600">
                    Система отслеживает активность пользователей и автоматически
                    завершает неактивные сессии
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Ограничение сессий
                  </p>
                  <p className="text-sm text-gray-600">
                    Максимум 3 активные сессии на устройство для предотвращения
                    злоупотреблений
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Управление сессиями
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Текущая сессия
                    </p>
                    <p className="text-sm text-gray-600">JWT токен активен</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      Активна
                    </p>
                    <p className="text-xs text-gray-500">
                      Истекает через 1 день
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Activity Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Authentication Activity
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Monitor your recent authentication events and security activity.
            </p>
            <AuthActivityLog className="max-h-96 overflow-y-auto" />
          </div>

          {/* Security Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-4">
              Рекомендации по безопасности
            </h3>

            <ul className="space-y-2 text-sm text-amber-700">
              <li>• Регулярно проверяйте список активных сессий</li>
              <li>• Завершайте сессии на незнакомых устройствах</li>
              <li>
                • Не оставляйте браузер открытым на общедоступных компьютерах
              </li>
              <li>
                • При подозрении на компрометацию аккаунта завершите все сессии
              </li>
              <li>• Используйте сильные и уникальные пароли</li>
              <li>• Обновляйте браузер и операционную систему</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
