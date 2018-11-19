package com.fmning.share.utils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

public class Utils {

	public static final String PROPERTIES_FILE = "settings.properties";
	public static final String RECYCLE_BIN_FOLDER_NAME = ".sharedrive_deleted";
	
	public static final String ADMIN_USERNAME = "adminUsername";
	public static final String ADMIN_PASSWORD = "adminPassword";
	public static final String HOME_DIRECTORY = "homeDir";
	public static final String USER_LIST = "users";
	
	public static String USERNAME_COOKIE_KEY = "";
	public static String PASSWORD_COOKIE_KEY = "";
	public static String ADMIN_COOKIE_KEY = "";
	
	public static User admin;
	public static String homeDir;
	private static List<User> userList = new ArrayList<>();;
	
	public static boolean setupNeeded = false;
	
	public static String validateSettings(Properties prop) {
		setupNeeded = true;
		if (prop == null) {
			return "Properties file cannot be read.";
		}
		String username = prop.getProperty(ADMIN_USERNAME);
		if (isNullOrEmpty(username)) {
			return "Admin username is missing";
		}
		
		String password = prop.getProperty(ADMIN_PASSWORD); 
		if (isNullOrEmpty(password)) {
			return "Admin password is missing";
		}
		
		homeDir = prop.getProperty(HOME_DIRECTORY);
		if (isNullOrEmpty(homeDir)) {
			return "Home directory is missing";
		}
		
		admin = new User(username, password, true);
		
		try {
			String usersJson = prop.getProperty(USER_LIST);
			ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
			List<User> users = mapper.readValue(usersJson, new TypeReference<List<User>>(){});
			
			userList.addAll(users);
		} catch (Exception e) {
			try {
				prop.remove(USER_LIST);
				prop.store(new FileOutputStream(PROPERTIES_FILE), "");
			} catch (Exception ex) {
				return "User list corrupted but failed to remove from config file";
			}
		}
		
		setupNeeded = false;
		return "";
	}
	
	public static void guardExistRecycleBin(String binPath) throws IllegalStateException {
		File recycleBin = new File(binPath);
	    
	    if (! recycleBin.exists()){
	    	boolean success = recycleBin.mkdir();
	    	if (!success) throw new IllegalStateException("Cannot create the given path. Make sure hosting software has read and write access to the path");
	    	
	    	try {
		    	Boolean hidden = (Boolean) Files.getAttribute(recycleBin.toPath(), "dos:hidden", LinkOption.NOFOLLOW_LINKS);
		    	if (hidden != null && !hidden) {
		    		Files.setAttribute(recycleBin.toPath(), "dos:hidden", Boolean.TRUE, LinkOption.NOFOLLOW_LINKS);
		    	}
	    	} catch (IOException ignored) {};
	    }
	}
	
	public static User findUser(String password) {
		if (admin.password.equals(password)) return admin;
		return userList.parallelStream().filter(user -> user.password.equals(password)).findAny().orElse(null);
	}
	
	public static User findUser(String username, String password) {
		if (admin.username.equals(username) && admin.password.equals(password)) return admin;
		return userList.parallelStream().filter(user -> user.username.equals(username)).filter(user -> user.password.equals(password)).findAny().orElse(null);
	}
	
	public static String changePassword(String username, String previousPassword, String newPassword) {
		if (admin.username.equals(username) && admin.password.equals(previousPassword)) {
			admin.password = newPassword;
			try {
				saveSettings();
			} catch (Exception e) {
				admin.password = previousPassword;
				return e.getMessage();
			}
		} else {
			User user = findUser(username, previousPassword);
			if (user == null) return "The current password does not match what's on the record.";
			userList.remove(user);
			String rollBackPwd = user.password;
			user.password = newPassword;
			userList.add(user);
			try {
				saveSettings();
			} catch (Exception e) {
				userList.remove(user);
				user.password = rollBackPwd;
				userList.add(user);
				return e.getMessage();
			}
		}
		
		return "";
	}
	
	public static void saveSettings () throws Exception{
		ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		StringWriter sw =new StringWriter();
		
		Properties prop = new Properties();
		prop.setProperty(Utils.ADMIN_USERNAME, admin.username);
		prop.setProperty(Utils.ADMIN_PASSWORD, admin.password);
		prop.setProperty(Utils.HOME_DIRECTORY, homeDir);
		if (userList.size() > 0) {
			mapper.writeValue(sw, userList);
			prop.setProperty(USER_LIST, sw.toString());
		}
		
		prop.store(new FileOutputStream(Utils.PROPERTIES_FILE), "");
	}
	
	public static boolean isNullOrEmpty(String string) {
		return string == null ? true : (string.trim() == "");
	}
}
