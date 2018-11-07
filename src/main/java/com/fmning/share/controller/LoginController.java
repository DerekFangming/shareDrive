package com.fmning.share.controller;

import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.GenericResponse;

@RestController
@RequestMapping("/api")
public class LoginController {

	@Value("${secretPasscode}")
	private String secretPasscode;

	@Value("${secretKey}")
	private String secretKey;

	@Value("${secretValue}")
	private String secretValue;
	
	@PostMapping("/login")
	public GenericResponse login(@RequestBody Map<String, Object> payload, HttpServletResponse response) {
		String passcode = (String)payload.get("passcode");
		if (passcode != null && !passcode.equals(secretPasscode)) {
			Cookie cookie = new Cookie(secretKey, "");
			cookie.setMaxAge(0);
			cookie.setPath("/");
			response.addCookie(cookie);
			return new GenericResponse("Incorrect passcode. Please try again");
		}
		
		Cookie cookie = new Cookie(secretKey, secretValue);
		cookie.setPath("/");
		response.addCookie(cookie);
		return new GenericResponse();
	}

}
