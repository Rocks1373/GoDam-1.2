package com.godam.auth;

import com.godam.common.User;
import com.godam.common.UserRepository;
import com.godam.auth.dto.LoginRequest;
import com.godam.auth.dto.LoginResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  public LoginResponse login(LoginRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new RuntimeException("Invalid username or password"));

    if (!user.getActive()) {
      throw new RuntimeException("User account is disabled");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new RuntimeException("Invalid username or password");
    }

    String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getUserId());

    return new LoginResponse(token, user.getUserId(), user.getUsername(), user.getRole());
  }

  public User createUser(String username, String password, String role, String email) {
    if (userRepository.existsByUsername(username)) {
      throw new RuntimeException("Username already exists");
    }

    User user = new User();
    user.setUsername(username);
    user.setPassword(passwordEncoder.encode(password));
    user.setRole(role);
    user.setEmail(email);
    user.setActive(true);
    long now = System.currentTimeMillis();
    user.setCreatedAt(now);
    user.setUpdatedAt(now);

    return userRepository.save(user);
  }

  public String encodePassword(String password) {
    return passwordEncoder.encode(password);
  }

  public boolean matchesPassword(String rawPassword, String encodedPassword) {
    return passwordEncoder.matches(rawPassword, encodedPassword);
  }
}
