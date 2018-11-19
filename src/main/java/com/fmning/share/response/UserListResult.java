package com.fmning.share.response;

import java.util.ArrayList;
import java.util.List;

import com.fmning.share.utils.User;

public class UserListResult {
	
	private String error;
	private List<User> userList;
	
	public UserListResult (String error) {
		this.error = error;
		this.userList = new ArrayList<>();
	}
	
	public UserListResult ( List<User> userList) {
		this.error = "";
		this.userList = userList;
	}
	
	public String getError() {
		return error;
	}
	
	public void setError(String error) {
		this.error = error;
	}
	
	public List<User> getUserList() {
		return userList;
	}
	
	public void setUserList(List<User> userList) {
		this.userList = userList;
	}

}
