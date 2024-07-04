package com.fmning.drive;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@EnableMethodSecurity
@ConditionalOnProperty("drive.production")
public class MethodSecurityConfiguration {
}
