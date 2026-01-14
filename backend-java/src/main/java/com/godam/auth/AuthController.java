package com.godam.auth;

import com.godam.auth.dto.LoginRequest;
import com.godam.auth.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
      LoginResponse response = authService.login(request);
      return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
      Map<String, String> error = new HashMap<>();
      error.put("message", e.getMessage());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
  }

  @PostMapping("/verify-password")
  public ResponseEntity<?> verifyPassword(@RequestBody Map<String, String> request) {
    // This endpoint is used by the Flutter app to verify admin password
    // For now, we'll implement a simple check
    String password = request.get("password");

    if (password == null || password.isEmpty()) {
      Map<String, String> error = new HashMap<>();
      error.put("message", "Password is required");
      return ResponseEntity.badRequest().body(error);
    }

    // TODO: Implement proper password verification logic
    // For now, accept any non-empty password
    Map<String, String> response = new HashMap<>();
    response.put("message", "Password verified");
    return ResponseEntity.ok(response);
  }

  @GetMapping("/test-password")
  public ResponseEntity<?> testPassword() {
    // Debug endpoint to test BCrypt password matching
    Map<String, Object> response = new HashMap<>();

    // Test the stored hash
    String storedHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    String testPassword = "123456789";

    response.put("testPassword", testPassword);
    response.put("storedHash", storedHash);

    // Encode a new password to compare
    String newHash = authService.encodePassword(testPassword);
    response.put("newHash", newHash);

    // Test if the stored hash matches the password
    boolean matches = authService.matchesPassword(testPassword, storedHash);
    response.put("matchesStoredHash", matches);

    // Test if the new hash matches the password
    boolean newHashMatches = authService.matchesPassword(testPassword, newHash);
    response.put("newHashMatchesPassword", newHashMatches);

    return ResponseEntity.ok(response);
  }
}
