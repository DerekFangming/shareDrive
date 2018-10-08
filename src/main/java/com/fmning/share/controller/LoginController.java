package com.fmning.share.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {
	
	@Value("${somekey}")
	private String enableMocks;
	
	@GetMapping("/test")
	public String sayHell1o() {
		return enableMocks;
	}

}
