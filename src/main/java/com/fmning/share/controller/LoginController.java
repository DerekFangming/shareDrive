package com.fmning.share.controller;

import java.io.StringWriter;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
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
			User user = Utils.findUser(username, password);
			
			if (user != null) {
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
	
	@PostMapping("/change_password")
	public GenericResponse changePassword(@RequestBody Map<String, Object> payload, HttpServletResponse response) throws Exception {
		Thread.sleep(1000);
		String username = (String)payload.get("username");
		String previousPassword = (String)payload.get("previousHashcode");
		String newPassword = (String)payload.get("newHashcode");
		
		String result = Utils.changePassword(username, previousPassword, newPassword);
		
		if (result.endsWith("")) {
			Cookie passwordCookie = new Cookie(Utils.PASSWORD_COOKIE_KEY, newPassword);
			passwordCookie.setPath("/");
			response.addCookie(passwordCookie);
		}
		
		return new GenericResponse(result);
	}
	
	@GetMapping("/test")
	public void login() throws Exception {
		String a = "[{\"username\":\"test\", \"password\":\"rand\"}, {\"username\":\"test2\", \"password\":\"rand haha\"}]";
		
		
		ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		List<User> myObjects = mapper.readValue(a, new TypeReference<List<User>>(){});
		
		for (User u : myObjects) {
			System.out.println(u.username);
			System.out.println(u.isAdmin);
		}
		
		final StringWriter sw =new StringWriter();
		mapper.writeValue(sw, myObjects);
		System.out.println(sw.toString());
	}

}
