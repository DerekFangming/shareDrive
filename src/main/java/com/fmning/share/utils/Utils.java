package com.fmning.share.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class Utils {

	public static final String PROPERTIES_FILE = "settings.properties";
	public static final String RECYCLE_BIN_FOLDER_NAME = ".sharedrive_deleted";
	
	public static final String ADMIN_USERNAME = "adminUsername";
	public static final String ADMIN_PASSWORD = "adminPassword";
	public static final String HOME_DIRECTORY = "homeDir";
	
	public static String homeDir;
	
	public static boolean setupNeeded = false;
	
	public static void test(String a) {
		//DigestUtils.sha256Hex(stringText);
	}
	
	public static String validateSettings(Properties prop) {
		setupNeeded = true;
		if (prop == null) {
			return "Properties file cannot be read.";
		}
		
		if (isNullOrEmpty(prop.getProperty(ADMIN_USERNAME))) {
			return "Admin username is missing";
		}
		
		if (isNullOrEmpty(prop.getProperty(ADMIN_PASSWORD))) {
			return "Admin password is missing";
		}
		
		if (isNullOrEmpty(prop.getProperty(HOME_DIRECTORY))) {
			return "Home directory is missing";
		}
		
		setupNeeded = false;
		return "";
	}
	
	public static boolean isNullOrEmpty(String string) {
		return string == null ? true : (string.trim() == "");
	}
	
	public class User {
		public String username;
		public String password;
		public String hash;
	}
}
