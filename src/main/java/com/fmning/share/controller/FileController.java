package com.fmning.share.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.net.URLEncoder;

import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FileController {
	
	@Value("${homeDir}")
	private String homeDir;
	
	@GetMapping("/download_file")
	public void getFile(HttpServletResponse response) throws IOException {
		
//		InputStream is = new FileInputStream(homeDir + "arrow.png");
//		FileCopyUtils.copy(is, response.getOutputStream());
//		response.flushBuffer();
		
		File file = new File(homeDir + "7Sense 【福小靓】七朵   落花情 镜面放慢分段舞蹈教学超清版.mp4jk");
		
		String mimeType= URLConnection.guessContentTypeFromName(file.getName());
        if (mimeType == null) mimeType = "application/octet-stream";
         
        response.setContentType(mimeType);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + URLEncoder.encode(file.getName(), "UTF-8").replace("+", "%20") + "\"");
        response.setContentLength((int)file.length());
 
        InputStream inputStream = new BufferedInputStream(new FileInputStream(file));
 
        //Copy bytes from source to destination(outputstream in this example), closes both streams.
        FileCopyUtils.copy(inputStream, response.getOutputStream());
		
	}
	
	@GetMapping("/download_file1")
	public void getFile2(HttpServletResponse response) throws IOException {
		 System.out.println(URLEncoder.encode("7Sense 【福小靓】七朵   落花情 镜面放慢分段舞蹈教学超清版.mp4", "UTF-8").replace("+", "%20"));
	}

}
