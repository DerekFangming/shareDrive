package com.fmning.share.controller;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.fmning.share.utils.Utils;


@Controller
public class HomeController {

	@RequestMapping(value = "/")
	public String index(HttpServletResponse response) {
		if (Utils.setupNeeded) {
			Cookie passwordCookie = new Cookie(Utils.SETUP_COOKIE_KEY, "true");
			passwordCookie.setPath("/");
			response.addCookie(passwordCookie);
		}
		return "index";
	}

}