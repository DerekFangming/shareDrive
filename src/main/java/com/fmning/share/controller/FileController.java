package com.fmning.share.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.FileDownloadResult;
import com.fmning.share.response.FileRenameResult;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.ResponseList;

@RestController
@RequestMapping("/api")
public class FileController {
	
	@Value("${homeDir}")
	private String homeDir;
	
	@GetMapping("/download_file")
	public FileDownloadResult getFile(@RequestParam("file") String filename, HttpServletResponse response) throws IOException {
		
		File file = new File(homeDir + filename);
		
		if (file.isDirectory()) {
			return new FileDownloadResult("Cannot download a directory");
		} else if (!file.isFile()) {
			return new FileDownloadResult("The file does not exist");
		}
		
		String mimeType= URLConnection.guessContentTypeFromName(file.getName());
        if (mimeType == null) mimeType = "application/octet-stream";
        
        String encodedFileName = URLEncoder.encode(file.getName(), "UTF-8").replace("+", "%20").replace("%28", "(").replace("%29", ")");
         
        response.setContentType(mimeType);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\"");
        response.setContentLength((int)file.length());
 
        InputStream inputStream = new BufferedInputStream(new FileInputStream(file));
        FileCopyUtils.copy(inputStream, response.getOutputStream());
        
		return null;
	}
	
	@PostMapping("/rename_file")
	public FileRenameResult renameFile(@RequestBody Map<String, Object> payload) throws InterruptedException {
		
		Thread.sleep(2000);
		
		String filePath = (String)payload.get("filePath");
		String newName = (String)payload.get("name");
		if (filePath == null || newName == null) return new FileRenameResult("The request is not complete");
		
		File oldFile = new File(homeDir + filePath);
		//File newFile = new File()

		System.out.println("old: " + filePath);
		System.out.println("new: " + oldFile.getPath() + newName);
		
		return new FileRenameResult("");
	}

}
