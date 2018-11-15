package com.fmning.share.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.fmning.share.utils.Utils;


@Controller
public class HomeController {

	@RequestMapping(value = "/")
	public String index() {
		if (Utils.setupNeeded) {
			return "setup";
		} else {
			return "index";
		}
	}

}