package com.fmning.share;

import java.io.FileInputStream;
import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.fmning.share.utils.Utils;

@Component
public class Initializer {
			
	@Value("${usernameCookieKey}")
	private String usernameCookieKey;
	
	@Value("${passwordCookieKey}")
	private String passwordCookieKey;
	
	@Value("${adminCookieKey}")
	private String adminCookieKey;

	
	@EventListener(ApplicationReadyEvent.class)
	public void initilizer(){

		Utils.USERNAME_COOKIE_KEY = usernameCookieKey;
		Utils.PASSWORD_COOKIE_KEY = passwordCookieKey;
		Utils.ADMIN_COOKIE_KEY = adminCookieKey;
		
		try {
			Properties prop = new Properties();
			prop.load(new FileInputStream(Utils.PROPERTIES_FILE));
			String errors = Utils.validateSettings(prop);
			if (errors.equals("")) {
				Utils.guardExistRecycleBin(Utils.homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
			}
			//Else not needed since set up flag is already turned on
		} catch (Exception ignored) {
			Utils.setupNeeded = true;
		}
		
		try {
			Utils.guardExistRecycleBin(Utils.homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
		} catch (Exception ignored) {
			Utils.setupNeeded = true;
		}

	}

}
