package com.fmning.drive;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "drive")
public class DriveProperties {
    private String production;
    private String rootDir;
    private String dbUsername;
    private String dbPassword;
    private String ssoBaseUrl;

    public boolean isProduction() {
        return Boolean.parseBoolean(production);
    }
}
