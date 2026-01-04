package com.godam.movements;

import java.util.Arrays;

public enum MovementType {
  O101_UPLOADED("O101"),
  O102_PICK_REQUESTED("O102"),
  O103_PICKED("O103"),
  O104_CHECKED("O104"),
  O105_CONFIRMED("O105"),
  O106_LOADED("O106"),
  O107_ON_THE_WAY("O107"),
  O108_DELIVERED("O108"),
  O109_CLOSED("O109"),

  I201_INBOUND_RECEIVED("I201"),
  I202_PUTAWAY("I202");

  private final String code;

  MovementType(String code) {
    this.code = code;
  }

  public String getCode() {
    return code;
  }

  public static MovementType fromCode(String code) {
    return Arrays.stream(values())
        .filter(v -> v.code.equals(code))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown movement code: " + code));
  }
}
