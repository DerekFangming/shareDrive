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
	
	@GetMapping("/hello")
	public List<Employee> sayHello() {
		Employee e1 = new Employee("Addy", "fark", "a");
		Employee e2 = new Employee("Bddy", "fark", "a");
		Employee e3 = new Employee("Cddy", "fark", "a");
		return Arrays.asList(e1, e2, e3);
	}
	
	@GetMapping("/test")
	public String sayHell1o() {
		return enableMocks;
	}

}
