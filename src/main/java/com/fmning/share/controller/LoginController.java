package com.fmning.share.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.utils.ApplicationProperties;

@RestController
public class LoginController {
	
	@Value("${somekey}")
	private String enableMocks;
	
	@GetMapping("/test")
	public String sayHell1o() {
		return enableMocks;
	}

}
