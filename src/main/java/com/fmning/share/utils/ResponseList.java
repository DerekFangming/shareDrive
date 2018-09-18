package com.fmning.share.utils;

import java.util.List;

public class ResponseList {
	
	private String error;
	private List<Object> objList;
	
	public ResponseList(List<Object> objList) {
		this.error = "";
		this.objList = objList;
	}
	
	public ResponseList(String error) {
		this.error = error;
	}
	
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}
	public List<Object> getObjList() {
		return objList;
	}
	public void setObjList(List<Object> objList) {
		this.objList = objList;
	}

}
