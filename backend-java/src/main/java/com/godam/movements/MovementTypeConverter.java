package com.godam.movements;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MovementTypeConverter implements AttributeConverter<MovementType, String> {
  @Override
  public String convertToDatabaseColumn(MovementType attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.getCode();
  }

  @Override
  public MovementType convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.trim().isEmpty()) {
      return null;
    }
    return MovementType.fromCode(dbData.trim());
  }
}
