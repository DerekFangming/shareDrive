package com.fmning.share.controller;

import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.GenericResponse;
import com.fmning.share.utils.User;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class LoginController {
	
	@PostMapping("/login")
	public GenericResponse login(@RequestBody Map<String, Object> payload, HttpServletResponse response) {
		String username = (String)payload.get("username");
		String password = (String)payload.get("hashcode");
		if (username != null && password != null) {
			User user = Utils.findUser(password);
			
			if (user != null && user.username.equals(username)) {
				Cookie usernameCookie = new Cookie(Utils.USERNAME_COOKIE_KEY, username);
				usernameCookie.setPath("/");
				response.addCookie(usernameCookie);
				Cookie passwordCookie = new Cookie(Utils.PASSWORD_COOKIE_KEY, password);
				passwordCookie.setPath("/");
				response.addCookie(passwordCookie);
				
				if (user.isAdmin) {
					Cookie adminCookie = new Cookie(Utils.ADMIN_COOKIE_KEY, "true");
					adminCookie.setPath("/");
					response.addCookie(adminCookie);
				}
				
				return new GenericResponse();
			}
		}
		return new GenericResponse("Incorrect passcode. Please try again");
	}

}
