import { DataSource } from "typeorm";
import { User } from "../src/entities/user.entity";
import dataSource from "../src/database/data-source";

async function updateUserRoles() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    console.log("Database connected successfully");

    const userRepository = dataSource.getRepository(User);

    // Find user by email
    const email = "vasya1@example.com"; // Change this to the actual user email
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log(`Current user roles:`, user.roles);

    // Update user roles to include admin
    user.roles = ["admin", "operator", "tenant"];
    await userRepository.save(user);

    console.log(`User roles updated successfully:`, user.roles);
    console.log(`User ${user.full_name} (${user.email}) now has admin access`);
  } catch (error) {
    console.error("Error updating user roles:", error);
  } finally {
    // Close database connection
    await dataSource.destroy();
    console.log("Database connection closed");
  }
}

// Run the script
updateUserRoles();
