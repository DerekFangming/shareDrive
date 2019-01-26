package com.fmning.share.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.HandshakeResult;

@RestController
@RequestMapping("/api")
public class ClientHandshakeController {
	
	@GetMapping("/handshake")
	public HandshakeResult handshake() {
		
		return new HandshakeResult("1.3");
	}

}
