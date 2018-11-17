package com.fmning.share.controller;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Map;
import java.util.Properties;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.GenericResponse;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class SettingController {
	
	@PostMapping("/initial_setup")
	public GenericResponse login(@RequestBody Map<String, Object> payload, HttpServletResponse response) throws InterruptedException {
		Thread.sleep(2000);
		String username = (String)payload.get("username");
		String password = (String)payload.get("password");
		String homeDir = (String)payload.get("homeDir");
		
		if (username == null || password == null || homeDir == null) return new GenericResponse("The request is not complete");
		
		if (!homeDir.endsWith("/")) homeDir += "/";
		
		File home = new File(homeDir);
		
		if (home.exists()) {
			if (home.isFile()) {
				return new GenericResponse("The given path is actualy a file. Please enter the path to a directory");
			}
			Utils.guardExistRecycleBin(homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
		} else {
			try {
				boolean success = home.mkdirs();
				if (!success) return new GenericResponse("Cannot create the given path. Make sure hosting software has read and write access to the path");
				
				Utils.guardExistRecycleBin(homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
				
			} catch (Exception e) {
				return new GenericResponse("Cannot set up share drive path. Make sure hosting software has read and write access to the path");
			}
		}
		
		System.out.println(username + password + homeDir);
		
		Properties prop = new Properties();
		prop.setProperty(Utils.ADMIN_USERNAME, username);
		prop.setProperty(Utils.ADMIN_PASSWORD, password);
		prop.setProperty(Utils.HOME_DIRECTORY, homeDir);
		
		String errors = Utils.validateSettings(prop);
		if (!errors.equals("")) {
			return new GenericResponse(errors);
		}
		
		try {
			prop.store(new FileOutputStream(Utils.PROPERTIES_FILE), "");
		} catch (Exception e) {
			return new GenericResponse("Cannot save settings. Make sure hosting software has read and write access to the path");
		}
		
		Cookie usernameCookie = new Cookie(Utils.USERNAME_COOKIE_KEY, username);
		usernameCookie.setPath("/");
		response.addCookie(usernameCookie);
		Cookie passwordCookie = new Cookie(Utils.PASSWORD_COOKIE_KEY, password);
		passwordCookie.setPath("/");
		response.addCookie(passwordCookie);
		Cookie adminCookie = new Cookie(Utils.ADMIN_COOKIE_KEY, "true");
		adminCookie.setPath("/");
		response.addCookie(adminCookie);
		
		return new GenericResponse();
	}
	
	

}
