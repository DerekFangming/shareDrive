package com.fmning.share.utils;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
	public String username;
	public String password;
	
	@JsonIgnore
	public boolean isAdmin;

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
	
	@JsonIgnore
	public boolean isAdmin() {
		return isAdmin;
	}

	@JsonIgnore
	public void setAdmin(boolean isAdmin) {
		this.isAdmin = isAdmin;
	}

	@JsonCreator
	public User (@JsonProperty("username") String username, @JsonProperty("password") String password) {
		this(username, password, false);
	}
	
	public User (String username, String password, boolean isAdmin) {
		this.username = username;
		this.password = password;
		this.isAdmin = isAdmin;
	}
}
