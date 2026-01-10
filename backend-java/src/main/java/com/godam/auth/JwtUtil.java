package com.godam.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
  
  // Secret key for JWT signing (in production, use environment variable)
  private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(
      "godam-secret-key-for-jwt-token-generation-must-be-at-least-256-bits".getBytes()
  );
  
  // Token validity: 24 hours
  private static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = extractAllClaims(token);
    return claimsResolver.apply(claims);
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(SECRET_KEY)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private Boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }

  public String generateToken(String username, String role, Long userId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", role);
    claims.put("userId", userId);
    return createToken(claims, username);
  }

  private String createToken(Map<String, Object> claims, String subject) {
    return Jwts.builder()
        .claims(claims)
        .subject(subject)
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
        .signWith(SECRET_KEY)
        .compact();
  }

  public Boolean validateToken(String token, String username) {
    final String extractedUsername = extractUsername(token);
    return (extractedUsername.equals(username) && !isTokenExpired(token));
  }

  public String extractRole(String token) {
    Claims claims = extractAllClaims(token);
    return claims.get("role", String.class);
  }

  public Long extractUserId(String token) {
    Claims claims = extractAllClaims(token);
    return claims.get("userId", Long.class);
  }
}
