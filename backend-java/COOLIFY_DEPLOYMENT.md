# Coolify Deployment Notes (GoDam Java Backend)

1. **Coolify deployment configuration**
   - Repository path: `backend-java`/this project.
   - Coolify can build the container directly: set the build context to `backend-java`, let it detect the `Dockerfile`, and it will run `mvn clean package -DskipTests` during the multi-stage build.
   - If you prefer to deploy the JAR directly, the artifact still exists at `target/godam-backend-0.0.1-SNAPSHOT.jar` after `./mvnw clean package -DskipTests`, and the run command remains `java -jar target/godam-backend-0.0.1-SNAPSHOT.jar`.
   - Internal port: `8080`. Coolify will expose it on `8081`.

2. **Docker Compose (useful for local/staging)**
   - `docker-compose up --build`
   - The compose file builds the same multi-stage image as the Coolify pipeline and mounts a persistent volume at `/data` for the SQLite DB (`godam-backend-data`).

3. **Environment variables**
   - `PORT=8080`
   - `GODAM_DB_URL=jdbc:sqlite:/data/godam.db` (overrides app.yml)
   - Optional: `GODAM_DB_PATH` is still respected if you prefer to point elsewhere.

3. **Environment variables**
   - `PORT=8080`
   - `GODAM_DB_URL=jdbc:sqlite:/data/godam.db` (overrides app.yml)
   - Optional: `GODAM_DB_PATH` is still respected if you prefer to point elsewhere.

4. **Volumes**
   - Mount a persistent volume to `/data` and place the SQLite database inside (e.g., `/opt/godam/data/godam.db`).
   - The backend will read/write `/data/godam.db` automatically thanks to the configured env var.

5. **Database preparation**
   - Run `backend-java/migrate-database.sh` (with your VPS credentials) or manually recreate the `Users` table so it matches the entity:
     ```sql 
     CREATE TABLE Users (
       user_id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL,
       role TEXT NOT NULL,
       email TEXT,
       active INTEGER NOT NULL DEFAULT 1,
       created_at INTEGER,
       updated_at INTEGER
     );
     ```
   - Seed users via `DataInitializer` (automatically runs when `/data/godam.db` is empty) or run `backend-java/insert-users.sh`.

6. **Health checks**
   - Hit `/auth/login` with `godam_admin / 123456789` after deployment to verify authentication.
   - Use `/actuator/health` if you add Spring Boot Actuator later.

7. **Rebuild note**
   - After code changes, rerun the build step and redeploy; Coolify will restart the app automatically.
