package com.fmning.drive;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.security.oauth2.resource.PrincipalExtractor;
import org.springframework.security.jwt.Jwt;
import org.springframework.security.jwt.JwtHelper;

import java.util.Map;

public class DrivePrincipalExtractor implements PrincipalExtractor {

    ObjectMapper objectMapper;

    public DrivePrincipalExtractor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public SsoUser extractPrincipal(Map<String, Object> map) {
        Map<String, String> details = (Map<String, String>) map.get("details");
        Jwt jwt = JwtHelper.decode(details.get("tokenValue"));
        try {
            Map<String, Object> claims = objectMapper.readValue(jwt.getClaims(), Map.class);
            SsoUser ssoUser = SsoUser.builder()
                    .name(claims.containsKey("name") ? claims.get("name").toString() : null)
                    .userName(claims.containsKey("user_name") ? claims.get("user_name").toString() : null)
                    .avatar(claims.containsKey("avatar") ? claims.get("avatar").toString() : null)
                    .build();

            return ssoUser;


        } catch (JsonProcessingException e) {
            return SsoUser.builder().build();
        }
    }

}
