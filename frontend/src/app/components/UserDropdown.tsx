"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { Settings, LogOut, Mail, Sliders } from "lucide-react";
import styles from "./ui/DropdownStyles.module.scss";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();

  // Ensure component is mounted before showing dropdown
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Закрыть dropdown при клике вне его или нажатии Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      console.log("🔄 Starting logout process...");

      // Закрываем dropdown
      setIsOpen(false);

      // Вызываем API logout
      await authAPI.logout();
      console.log("✅ API logout successful");
    } catch (error) {
      console.error("❌ Logout API error:", error);
      // Продолжаем logout даже если API не ответил
    } finally {
      try {
        // Очищаем Redux состояние
        dispatch(logout());
        console.log("✅ Redux state cleared");

        // Очищаем все localStorage данные
        localStorage.clear();
        console.log("✅ LocalStorage cleared");

        // Перенаправляем на главную страницу
        router.push("/");
        console.log("✅ Redirected to home page");
      } catch (error) {
        console.error("❌ Error during logout cleanup:", error);
        // Принудительно перезагружаем страницу если что-то пошло не так
        window.location.href = "/";
      }
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/app/security");
  };

  const handlePreferences = () => {
    setIsOpen(false);
    router.push("/app/preferences");
  };

  const handleSupport = () => {
    setIsOpen(false);
    // Можно добавить модальное окно поддержки или перенаправление
    console.log("Support requested");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar/Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.avatarButton}
      >
        <div className={styles.userAvatarSmall}>
          {user.full_name
            ? user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : user.email?.[0].toUpperCase() || "U"}
        </div>
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.full_name || user.email?.split("@")[0] || "User"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isMounted && isOpen && (
        <div className={`absolute right-0 ${styles.dropdownContainer}`}>
          {/* User Info */}
          <div className={styles.dropdownHeader}>
            <div className="flex items-center space-x-4">
              <div className={styles.userAvatar}>
                {user.full_name
                  ? user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : user.email?.[0].toUpperCase() || "U"}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user.full_name || "User"}</p>
                <p className={styles.userEmail}>{user.email}</p>
                <p className={styles.userRole}>
                  {user.roles?.includes("operator") ? "Operator" : "Tenant"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className={styles.dropdownBody}>
            <button onClick={handleSettings} className={styles.dropdownItem}>
              <Settings className={styles.dropdownIcon} />
              <span className={styles.dropdownText}>Profile Settings</span>
            </button>

            <button onClick={handlePreferences} className={styles.dropdownItem}>
              <Sliders className={styles.dropdownIcon} />
              <span className={styles.dropdownText}>Change Preferences</span>
            </button>

            <button onClick={handleSupport} className={styles.dropdownItem}>
              <Mail className={styles.dropdownIcon} />
              <span className={styles.dropdownText}>Support</span>
            </button>

            <hr className={styles.dropdownDivider} />

            <button onClick={handleLogout} className={styles.dropdownItem}>
              <LogOut className={styles.dropdownIcon} />
              <span className={styles.dropdownText}>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
