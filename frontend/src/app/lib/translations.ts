export type Language = "en" | "ru";

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    close: string;
  };

  // Navigation & Header
  nav: {
    login: string;
    register: string;
    logout: string;
    profile: string;
    preferences: string;
    dashboard: string;
    security: string;
  };

  // Home Page
  home: {
    title: string;
    subtitle: string;
    description: string;
    startSearch: string;
    forOperators: string;
    smartSearch: {
      title: string;
      description: string;
    };
    verifiedProperties: {
      title: string;
      description: string;
    };
    personalApproach: {
      title: string;
      description: string;
    };
    readyToFind: {
      title: string;
      description: string;
      cta: string;
    };
    footer: string;
  };

  // Auth
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    email: string;
    password: string;
    fullName: string;
    login: string;
    register: string;
    noAccount: string;
    hasAccount: string;
    loginSuccess: string;
    registerSuccess: string;
    invalidCredentials: string;
    userExists: string;
    redirecting: string;
    redirectingToDashboard: string;
    welcomeToTada: string;
    selectAccountType: string;
    tenant: string;
    tenantDescription: string;
    operator: string;
    operatorDescription: string;
  };

  // Dashboard
  dashboard: {
    welcome: string;
    tenantWelcome: string;
    operatorWelcome: string;
    quickActions: string;
    viewProfile: string;
    editProfile: string;
    managePreferences: string;
    searchProperties: string;
    manageProperties: string;
    viewAnalytics: string;
    find_perfect_home: string;
    update_preferences: string;
    view_all_matches: string;
    featured_properties: string;
    featured_properties_description: string;
    matched_properties: string;
    matched_properties_description: string;
    view_all: string;
    set_preferences: string;
  };

  // Profile
  profile: {
    title: string;
    personalInfo: string;
    workInfo: string;
    lifestyle: string;
    ageRange: string;
    occupation: string;
    industry: string;
    workArrangement: string;
    pets: string;
    smoker: string;
    hobbies: string;
    idealLiving: string;
    additionalInfo: string;
    updateSuccess: string;
    updateError: string;
  };

  // Preferences
  preferences: {
    title: string;
    location: string;
    budget: string;
    property: string;
    primaryPostcode: string;
    secondaryLocation: string;
    commuteLocation: string;
    commuteWalk: string;
    commuteCycle: string;
    commuteTube: string;
    moveInDate: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
    maxBedrooms: string;
    minBathrooms: string;
    maxBathrooms: string;
    furnishing: string;
    letDuration: string;
    propertyType: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    notFound: string;
  };

  // Errors
  errors: {
    generic: string;
    network: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    validation: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      submit: "Submit",
      close: "Close",
    },
    nav: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      profile: "Profile",
      preferences: "Preferences",
      dashboard: "Dashboard",
      security: "Security",
    },
    home: {
      title: "Find the perfect",
      subtitle: "property",
      description:
        "TaDa is a modern platform for finding and managing properties. We connect tenants and operators to create perfect matches.",
      startSearch: "Start Searching",
      forOperators: "For Operators",
      smartSearch: {
        title: "Smart Search",
        description:
          "Find properties matching your criteria with our intelligent matching algorithm.",
      },
      verifiedProperties: {
        title: "Verified Properties",
        description:
          "All properties undergo thorough verification to ensure quality and safety.",
      },
      personalApproach: {
        title: "Personal Approach",
        description:
          "Customize your preferences and receive personalized property recommendations.",
      },
      readyToFind: {
        title: "Ready to find your home?",
        description:
          "Join thousands of users who have already found their perfect property with TaDa.",
        cta: "Register for Free",
      },
      footer: "© 2024 TaDa. All rights reserved.",
    },
    auth: {
      loginTitle: "Sign in to your account",
      loginSubtitle: "Welcome to TaDa",
      registerTitle: "Welcome to TaDa",
      registerSubtitle: "Choose your account type to register",
      email: "Email address",
      password: "Password",
      fullName: "Full name",
      login: "Sign In",
      register: "Register",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      loginSuccess: "Login successful",
      registerSuccess: "Registration successful",
      invalidCredentials:
        "Invalid email or password. Please check your credentials.",
      userExists: "User with this email already exists. Try a different email.",
      redirecting: "Redirecting...",
      redirectingToDashboard: "Redirecting to dashboard...",
      welcomeToTada: "Welcome to TaDa",
      selectAccountType: "Choose your account type to register",
      tenant: "Tenant",
      tenantDescription: "Looking for property to rent",
      operator: "Operator",
      operatorDescription: "Managing properties for rent",
    },
    dashboard: {
      welcome: "Welcome",
      tenantWelcome: "Welcome to your tenant dashboard",
      operatorWelcome: "Welcome to your operator dashboard",
      quickActions: "Quick Actions",
      viewProfile: "View Profile",
      editProfile: "Edit Profile",
      managePreferences: "Manage Preferences",
      searchProperties: "Search Properties",
      manageProperties: "Manage Properties",
      viewAnalytics: "View Analytics",
      find_perfect_home: "Find Perfect Home",
      update_preferences: "Update Preferences",
      view_all_matches: "View All Matches",
      featured_properties: "Featured Properties",
      featured_properties_description: "Properties that match your criteria",
      matched_properties: "Matched Properties",
      matched_properties_description: "Properties that match your criteria",
      view_all: "View All",
      set_preferences: "Set Preferences",
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal Information",
      workInfo: "Work Information",
      lifestyle: "Lifestyle",
      ageRange: "Age Range",
      occupation: "Occupation",
      industry: "Industry",
      workArrangement: "Work Arrangement",
      pets: "Pets",
      smoker: "Smoker",
      hobbies: "Hobbies",
      idealLiving: "Ideal Living Environment",
      additionalInfo: "Additional Information",
      updateSuccess: "Profile updated successfully",
      updateError: "Error updating profile",
    },
    preferences: {
      title: "Preferences",
      location: "Location",
      budget: "Budget",
      property: "Property",
      primaryPostcode: "Primary Postcode",
      secondaryLocation: "Secondary Location",
      commuteLocation: "Commute Location",
      commuteWalk: "Walking Time (minutes)",
      commuteCycle: "Cycling Time (minutes)",
      commuteTube: "Tube Time (minutes)",
      moveInDate: "Move-in Date",
      minPrice: "Minimum Price",
      maxPrice: "Maximum Price",
      minBedrooms: "Minimum Bedrooms",
      maxBedrooms: "Maximum Bedrooms",
      minBathrooms: "Minimum Bathrooms",
      maxBathrooms: "Maximum Bathrooms",
      furnishing: "Furnishing",
      letDuration: "Let Duration",
      propertyType: "Property Type",
      createSuccess: "Preferences created successfully",
      updateSuccess: "Preferences updated successfully",
      deleteSuccess: "Preferences deleted successfully",
      notFound: "No preferences found",
    },
    errors: {
      generic: "An error occurred. Please try again.",
      network: "Network error. Please check your connection.",
      unauthorized: "Unauthorized. Please login again.",
      forbidden: "Access forbidden.",
      notFound: "Resource not found.",
      validation: "Please check your input data.",
    },
  },
  ru: {
    common: {
      loading: "Загрузка...",
      error: "Ошибка",
      success: "Успешно",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      back: "Назад",
      next: "Далее",
      previous: "Предыдущий",
      submit: "Отправить",
      close: "Закрыть",
    },
    nav: {
      login: "Войти",
      register: "Регистрация",
      logout: "Выйти",
      profile: "Профиль",
      preferences: "Предпочтения",
      dashboard: "Панель",
      security: "Безопасность",
    },
    home: {
      title: "Найдите идеальную",
      subtitle: "недвижимость",
      description:
        "TaDa - это современная платформа для поиска и управления недвижимостью. Мы объединяем арендаторов и операторов для создания идеальных совпадений.",
      startSearch: "Начать поиск",
      forOperators: "Для операторов",
      smartSearch: {
        title: "Умный поиск",
        description:
          "Находите недвижимость по вашим критериям с помощью интеллектуального алгоритма сопоставления.",
      },
      verifiedProperties: {
        title: "Проверенные объекты",
        description:
          "Все объекты недвижимости проходят тщательную проверку для обеспечения качества и безопасности.",
      },
      personalApproach: {
        title: "Персональный подход",
        description:
          "Настройте свои предпочтения и получайте персонализированные рекомендации недвижимости.",
      },
      readyToFind: {
        title: "Готовы найти свой дом?",
        description:
          "Присоединяйтесь к тысячам пользователей, которые уже нашли свою идеальную недвижимость с TaDa.",
        cta: "Зарегистрироваться бесплатно",
      },
      footer: "© 2024 TaDa. Все права защищены.",
    },
    auth: {
      loginTitle: "Войти в аккаунт",
      loginSubtitle: "Добро пожаловать в TaDa",
      registerTitle: "Добро пожаловать в TaDa",
      registerSubtitle: "Выберите тип аккаунта для регистрации",
      email: "Email адрес",
      password: "Пароль",
      fullName: "Полное имя",
      login: "Войти",
      register: "Зарегистрироваться",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
      loginSuccess: "Вход выполнен успешно",
      registerSuccess: "Регистрация прошла успешно",
      invalidCredentials:
        "Неверный email или пароль. Проверьте правильность введенных данных.",
      userExists:
        "Пользователь с таким email уже существует. Попробуйте другой email.",
      redirecting: "Перенаправление...",
      redirectingToDashboard: "Перенаправление на панель...",
      welcomeToTada: "Добро пожаловать в TaDa",
      selectAccountType: "Выберите тип аккаунта для регистрации",
      tenant: "Арендатор",
      tenantDescription: "Ищу жилье для аренды",
      operator: "Арендодатель",
      operatorDescription: "Управляю недвижимостью для аренды",
    },
    dashboard: {
      welcome: "Добро пожаловать",
      tenantWelcome: "Добро пожаловать в панель арендатора",
      operatorWelcome: "Добро пожаловать в панель оператора",
      quickActions: "Быстрые действия",
      viewProfile: "Просмотр профиля",
      editProfile: "Редактировать профиль",
      managePreferences: "Управление предпочтениями",
      searchProperties: "Поиск недвижимости",
      manageProperties: "Управление недвижимостью",
      viewAnalytics: "Просмотр аналитики",
      find_perfect_home: "Найти идеальный дом",
      update_preferences: "Обновить предпочтения",
      view_all_matches: "Посмотреть все совпадения",
      featured_properties: "Предлагаемые объекты",
      featured_properties_description:
        "Объекты, соответствующие вашим критериям",
      matched_properties: "Совпавшие объекты",
      matched_properties_description:
        "Объекты, соответствующие вашим критериям",
      view_all: "Посмотреть все",
      set_preferences: "Установить предпочтения",
    },
    profile: {
      title: "Профиль",
      personalInfo: "Личная информация",
      workInfo: "Рабочая информация",
      lifestyle: "Образ жизни",
      ageRange: "Возрастная группа",
      occupation: "Профессия",
      industry: "Отрасль",
      workArrangement: "Рабочий режим",
      pets: "Домашние животные",
      smoker: "Курящий",
      hobbies: "Хобби",
      idealLiving: "Идеальная среда проживания",
      additionalInfo: "Дополнительная информация",
      updateSuccess: "Профиль успешно обновлен",
      updateError: "Ошибка обновления профиля",
    },
    preferences: {
      title: "Предпочтения",
      location: "Местоположение",
      budget: "Бюджет",
      property: "Недвижимость",
      primaryPostcode: "Основной почтовый индекс",
      secondaryLocation: "Дополнительное местоположение",
      commuteLocation: "Место работы",
      commuteWalk: "Время пешком (минуты)",
      commuteCycle: "Время на велосипеде (минуты)",
      commuteTube: "Время на метро (минуты)",
      moveInDate: "Дата заселения",
      minPrice: "Минимальная цена",
      maxPrice: "Максимальная цена",
      minBedrooms: "Минимум спален",
      maxBedrooms: "Максимум спален",
      minBathrooms: "Минимум ванных",
      maxBathrooms: "Максимум ванных",
      furnishing: "Мебель",
      letDuration: "Срок аренды",
      propertyType: "Тип недвижимости",
      createSuccess: "Предпочтения успешно созданы",
      updateSuccess: "Предпочтения успешно обновлены",
      deleteSuccess: "Предпочтения успешно удалены",
      notFound: "Предпочтения не найдены",
    },
    errors: {
      generic: "Произошла ошибка. Пожалуйста, попробуйте снова.",
      network: "Ошибка сети. Проверьте подключение к интернету.",
      unauthorized: "Не авторизован. Пожалуйста, войдите заново.",
      forbidden: "Доступ запрещен.",
      notFound: "Ресурс не найден.",
      validation: "Пожалуйста, проверьте введенные данные.",
    },
  },
};
