FROM eclipse-temurin:17-jre-jammy

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y ncurses-bin && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]