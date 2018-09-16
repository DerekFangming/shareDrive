package com.greglturnquist.payroll;

import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {
	
	@GetMapping("/hello")
	public List<Employee> sayHello() {
		Employee e1 = new Employee("Addy", "fark", "a");
		Employee e2 = new Employee("Bddy", "fark", "a");
		Employee e3 = new Employee("Cddy", "fark", "a");
		return Arrays.asList(e1, e2, e3);
	}

}
