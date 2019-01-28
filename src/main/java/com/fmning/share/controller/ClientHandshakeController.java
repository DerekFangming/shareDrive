package com.fmning.share.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.HandshakeResult;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class ClientHandshakeController {
	
	@GetMapping("/handshake")
	public HandshakeResult handshake() {
		
		if (Utils.setupNeeded) {
			return new HandshakeResult("1.3", "Share drive is not set up yet. Please open share drive through broswer and set it up.");
		} else {
			return new HandshakeResult("1.3");
		}
	}

}
