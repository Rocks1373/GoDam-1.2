package com.godam.health;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

  @GetMapping("/")
  public Map<String, Object> index() {
    return Map.of("status", "ok", "service", "GoDam backend");
  }
}
