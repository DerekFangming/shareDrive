package com.fmning.drive;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Configuration
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class SecurityConfig {

    private final DriveProperties driveProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        String[] urls = driveProperties.isProduction() ? new String[]{"/login-redirect", "/me", "/api/directory/**", "/api/shares"}
                : new String[]{};

        http.authorizeHttpRequests((requests) -> requests.requestMatchers(urls).authenticated().anyRequest().permitAll())
                .logout((logout) -> logout
                        .logoutSuccessUrl(driveProperties.getSsoBaseUrl() + "/logout")
                        .logoutRequestMatcher(new AntPathRequestMatcher("/logout")))
                .oauth2Login((oauth2Login) -> oauth2Login.userInfoEndpoint((userinfo) -> userinfo
                        .userAuthoritiesMapper(this.userAuthoritiesMapper())))
                .oauth2ResourceServer((resourceServer) -> resourceServer.jwt((jwt) ->
                        jwt.jwtAuthenticationConverter(jwtConverter())));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        String jwkUri = driveProperties.getSsoBaseUrl() + "/oauth/jwk";
        return NimbusJwtDecoder.withJwkSetUri(jwkUri)
                .build();
    }

    private JwtAuthenticationConverter jwtConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return converter;
    }

    private GrantedAuthoritiesMapper userAuthoritiesMapper() {
        return (authorities) -> {
            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

            authorities.forEach(authority -> {
                if (authority instanceof OAuth2UserAuthority) {
                    Map<String, Object> attributes = ((OAuth2UserAuthority) authority).getAttributes();
                    List<Object> auths = (List<Object>) attributes.get("authorities");
                    for (Object auth : auths) {
                        Map<String, String> authMap = (Map)auth;
                        mappedAuthorities.add(new SimpleGrantedAuthority(authMap.get("authority")));
                    }
                }
            });

            return mappedAuthorities;
        };
    }
}
