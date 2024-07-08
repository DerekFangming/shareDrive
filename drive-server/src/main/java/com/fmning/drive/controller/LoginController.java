package com.fmning.drive.controller;

import com.fmning.drive.DriveProperties;
import com.fmning.drive.SsoUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class LoginController {

    private final DriveProperties driveProperties;

    @GetMapping("/login-redirect")
    public void loginRedirect(@RequestParam("goto") String gotoUrl, HttpServletResponse httpServletResponse) {
        httpServletResponse.setHeader(HttpHeaders.LOCATION, gotoUrl);
        httpServletResponse.setStatus(HttpServletResponse.SC_MOVED_TEMPORARILY);
    }

    @GetMapping("/me")
    public SsoUser me() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof DefaultOAuth2User)) {
             if (driveProperties.isProduction()) {
                throw new AccessDeniedException("Access is denied");
            } else {
                return SsoUser.builder()
                        .name("User")
                        .userName("user@example.com")
                        .avatar("https://i.imgur.com/lkAhvIs.png")
                        .build();
            }
        }

        DefaultOAuth2User user = ((DefaultOAuth2User) principal);
        String avatar = user.getAttribute("avatar") == null ?
                "https://i.imgur.com/lkAhvIs.png" : user.getAttribute("avatar");

        return SsoUser.builder()
                .name(user.getAttribute("displayName"))
                .userName(user.getAttribute("username"))
                .avatar(avatar)
                .build();
    }

}
