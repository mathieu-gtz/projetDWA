FROM eclipse-temurin:17-jre-jammy

WORKDIR /app
COPY target/*.jar app.jar

RUN apt-get update && apt-get install -y ncurses-base

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]