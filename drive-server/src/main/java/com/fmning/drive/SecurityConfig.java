package com.fmning.drive;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.autoconfigure.security.oauth2.resource.PrincipalExtractor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableOAuth2Sso
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final DriveProperties driveProperties;

    @Override
    public void configure(HttpSecurity http) throws Exception {
        String[] urls = driveProperties.isProduction() ? new String[]{"/login-redirect", "/me", "/api/directory/**", "/api/shares"}
                : new String[]{};

        http
                .antMatcher("/**")
                .authorizeRequests()
                .antMatchers(urls)
                .authenticated()
                .anyRequest().permitAll()
                .and()
                .logout().logoutSuccessUrl("https://sso.fmning.com/authentication/logout").permitAll()
                .and().csrf().disable();
    }

    @Bean
    public PrincipalExtractor toolsPrincipalExtractor(ObjectMapper objectMapper) {
        return new DrivePrincipalExtractor(objectMapper);
    }
}
