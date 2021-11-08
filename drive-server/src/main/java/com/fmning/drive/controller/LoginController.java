package com.fmning.drive.controller;

import com.fmning.drive.SsoUser;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;

@RestController
public class LoginController {

    @GetMapping("/login-redirect")
    public void loginRedirect(@RequestParam("goto") String gotoUrl, HttpServletResponse httpServletResponse) {
        httpServletResponse.setHeader(HttpHeaders.LOCATION, gotoUrl);
        httpServletResponse.setStatus(HttpServletResponse.SC_MOVED_TEMPORARILY);
    }

    @GetMapping("/me")
    public SsoUser me() {
        return (SsoUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

}
