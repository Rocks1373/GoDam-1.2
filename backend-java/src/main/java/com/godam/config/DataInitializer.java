package com.godam.config;

import com.godam.common.User;
import com.godam.common.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;


@Configuration
public class DataInitializer {

  @Bean
  public CommandLineRunner initializeUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> {
      System.out.println("Purging existing users and starting fresh admin setup.");
      userRepository.deleteAll();

      createUser(userRepository, passwordEncoder, "admin", "admin", "ADMIN", "admin@godam.com");
      System.out.println("User initialization complete! Only 'admin'/'admin' exists with ADMIN privileges.");
    };
  }

  private void createUser(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          String username, String password, String role, String email) {
    User user = new User();
    user.setUsername(username);
    user.setPassword(passwordEncoder.encode(password));
    user.setRole(role);
    user.setEmail(email);
    user.setActive(true);
    long now = System.currentTimeMillis();
    user.setCreatedAt(now);
    user.setUpdatedAt(now);
    userRepository.save(user);
    System.out.println("Created user: " + username + " (" + role + ")");
  }
}
