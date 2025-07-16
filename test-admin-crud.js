// Test script for Admin CRUD operations
const testAdminCRUD = async () => {
  console.log("🧪 Testing Admin CRUD Operations");

  // Test data
  const testUser = {
    full_name: "Test User",
    email: "test@example.com",
    password: "testPassword123",
    role: "tenant",
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("accessToken");

  if (!token) {
    console.error("❌ No authentication token found. Please login first.");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // Test 1: Create User
    console.log("1️⃣ Testing Create User...");
    const createResponse = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(testUser),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("❌ Create user failed:", errorData);
      return;
    }

    const createdUser = await createResponse.json();
    console.log("✅ User created successfully:", createdUser);

    // Test 2: Get All Users
    console.log("2️⃣ Testing Get All Users...");
    const getUsersResponse = await fetch(`${apiUrl}/users?page=1&limit=10`, {
      headers,
    });

    if (!getUsersResponse.ok) {
      console.error("❌ Get users failed");
      return;
    }

    const usersData = await getUsersResponse.json();
    console.log(
      "✅ Users retrieved successfully:",
      usersData.total,
      "users found"
    );

    // Test 3: Update User
    console.log("3️⃣ Testing Update User...");
    const updateData = {
      full_name: "Updated Test User",
      email: testUser.email,
      role: "operator",
    };

    const updateResponse = await fetch(`${apiUrl}/users/${createdUser.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("❌ Update user failed:", errorData);
    } else {
      const updatedUser = await updateResponse.json();
      console.log("✅ User updated successfully:", updatedUser);
    }

    // Test 4: Delete User
    console.log("4️⃣ Testing Delete User...");
    const deleteResponse = await fetch(`${apiUrl}/users/${createdUser.id}`, {
      method: "DELETE",
      headers,
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error("❌ Delete user failed:", errorData);
    } else {
      console.log("✅ User deleted successfully");
    }

    console.log("🎉 All CRUD operations completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Export for use in browser console
if (typeof window !== "undefined") {
  window.testAdminCRUD = testAdminCRUD;
}

// Instructions for running the test
console.log(`
🧪 Admin CRUD Test Instructions:
1. Login as admin user
2. Navigate to the admin panel
3. Open browser console (F12)
4. Run: testAdminCRUD()
5. Check console for results

Note: This test will create and delete a test user during execution.
`);
