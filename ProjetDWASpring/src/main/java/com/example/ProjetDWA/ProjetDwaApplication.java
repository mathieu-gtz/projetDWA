package com.example.ProjetDWA;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.AbstractEnvironment;

@SpringBootApplication
public class ProjetDwaApplication {

	public static void main(String[] args) {

		// Activer le profil "prod"
		System.setProperty(AbstractEnvironment.ACTIVE_PROFILES_PROPERTY_NAME, "prod");

		SpringApplication.run(ProjetDwaApplication.class, args);
	}

}
