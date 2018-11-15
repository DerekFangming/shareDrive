package com.fmning.share.utils;

public class User {
	public String username;
	public String password;
	public boolean isAdmin;
	
	public User (String username, String password, boolean isAdmin) {
		this.username = username;
		this.password = password;
		this.isAdmin = isAdmin;
	}
}
