FROM maven:3.9.2-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

COPY pom.xml .
COPY src ./src

RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-alpine
WORKDIR /app

COPY --from=builder /workspace/target/godam-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
