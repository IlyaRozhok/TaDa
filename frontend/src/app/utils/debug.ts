export const debugUserRole = (user: any, context: string = "") => {
  console.group(`🔍 Debug User Role ${context}`);
  console.log("User object:", user);
  console.log("user.id:", user?.id);
  console.log("user.role:", user?.role);
  console.log("user.roles:", user?.roles);
  console.log("user.tenantProfile:", user?.tenantProfile);
  console.log("user.operatorProfile:", user?.operatorProfile);
  console.log("user.full_name:", user?.full_name);
  console.log("user.status:", user?.status);
  console.groupEnd();
};

export const debugRedirectLoop = (
  location: string,
  user: any,
  targetPath: string
) => {
  console.group(`🔄 Debug Redirect Loop - ${location}`);
  console.log("Current user:", user);
  console.log("Target path:", targetPath);
  console.log("User role:", user?.role);
  console.log("User roles array:", user?.roles);
  console.log("Has tenant profile:", !!user?.tenantProfile);
  console.log("Has operator profile:", !!user?.operatorProfile);
  console.log("Timestamp:", new Date().toISOString());
  console.groupEnd();
};
