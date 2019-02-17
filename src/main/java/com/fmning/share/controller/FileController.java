package com.fmning.share.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FilenameUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartRequest;

import com.fmning.share.response.FileDownloadResult;
import com.fmning.share.response.FileRenameResult;
import com.fmning.share.response.FileRetrieveResult;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.Range;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class FileController {
	
	@GetMapping("/download_file")
	public FileDownloadResult getFile(@RequestParam("file") String filename, HttpServletRequest request, HttpServletResponse response) throws IOException {
		File file = new File(Utils.homeDir + filename);
		
		if (file.isDirectory()) {
			return new FileDownloadResult("Cannot download a directory");
		} else if (!file.isFile()) {
			return new FileDownloadResult("The file does not exist");
		}
		
		String contentType= URLConnection.guessContentTypeFromName(file.getName());
        if (contentType == null) contentType = "application/octet-stream";
        
        String encodedFileName = URLEncoder.encode(file.getName(), "UTF-8").replace("+", "%20").replace("%28", "(").replace("%29", ")")
        		.replace("%5B", "[").replace("%5D", "]");
        
        // File range for resume function
        long length = file.length();
        Range full = new Range(0, length - 1, length);
        List<Range> ranges = new ArrayList<>();
        
        // Validate and process Range and If-Range headers.
        String range = request.getHeader("Range");
        if (range != null) {

            // Range header should match format "bytes=n-n,n-n,n-n...". If not, then return 416.
            if (!range.matches("^bytes=\\d*-\\d*(,\\d*-\\d*)*$")) {
                response.setHeader("Content-Range", "bytes */" + length); // Required in 416.
                response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                return new FileDownloadResult("Requested range is not in correct format.");
            }

            // If any valid If-Range header, then process each part of byte range.
            if (ranges.isEmpty()) {
                for (String part : range.substring(6).split(",")) {
                    // Assuming a file with length of 100, the following examples returns bytes at:
                    // 50-80 (50 to 80), 40- (40 to length=100), -20 (length-20=80 to length=100).
                    long start = Utils.sublong(part, 0, part.indexOf("-"));
                    long end = Utils.sublong(part, part.indexOf("-") + 1, part.length());

                    if (start == -1) {
                        start = length - end;
                        end = length - 1;
                    } else if (end == -1 || end > length - 1) {
                        end = length - 1;
                    }

                    // Check if Range is syntactically valid. If not, then return 416.
                    if (start > end) {
                        response.setHeader("Content-Range", "bytes */" + length); // Required in 416.
                        response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                        new FileDownloadResult("Requested range is not valid.");
                    }

                    // Add range.                    
                    ranges.add(new Range(start, end, length));
                }
            }
        }
        

        response.setCharacterEncoding("UTF-8");
        response.setBufferSize(Utils.DEFAULT_BUFFER_SIZE);
        response.setContentType(contentType);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\"");
        response.setHeader("Accept-Ranges", "bytes");
        response.setHeader("ETag", "\"" + filename + "\"");
        
        try (InputStream input = new BufferedInputStream(new FileInputStream(file));
                OutputStream output = response.getOutputStream()) {
        	if (ranges.isEmpty() || ranges.get(0) == full) {

                // Return full file.
                response.setHeader("Content-Range", "bytes " + full.start + "-" + full.end + "/" + full.total);
                response.setHeader("Content-Length", String.valueOf(full.length));
                Utils.copy(input, output, length, full.start, full.length);

            } else if (ranges.size() == 1) {

                // Return single part of file.
                Range r = ranges.get(0);
                response.setHeader("Content-Range", "bytes " + r.start + "-" + r.end + "/" + r.total);
                response.setHeader("Content-Length", String.valueOf(r.length));
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT); // 206.

                // Copy single part range.
                Utils.copy(input, output, length, r.start, r.length);

            } else {

                // Return multiple parts of file.
                response.setContentType("multipart/byteranges; boundary=MULTIPART_BYTERANGES");
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT); // 206.

                // Copy multi part range.
                for (Range r : ranges) {

                    // Copy single part range of multi part range.
                	Utils.copy(input, output, length, r.start, r.length);
                }

            }
        }
        
		return null;
	}
	
	@PostMapping("/rename_file")
	public FileRenameResult renameFile(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new FileRenameResult("Not autorized.");
		}
		
		String filePath = (String)payload.get("filePath");
		String newName = (String)payload.get("name");
		if (filePath == null || newName == null) return new FileRenameResult("The request is not complete");
		
		newName = newName.trim();
		if (newName.length() == 0) return new FileRenameResult("File name cannot be empty");
		
		if (newName.matches(".*[/\n\r\t\0\f`?*\\<>|\":].*")) return new FileRenameResult("File name cannot contain characters like / ` ? * \\ < > | \" :");
		
		File previousFile = new File(Utils.homeDir + filePath);		
		String previousExt = FilenameUtils.getExtension(previousFile.getPath());
		String newExt = FilenameUtils.getExtension(newName);
		
		if (!newExt.equals("") && !previousExt.toLowerCase().equals(newExt.toLowerCase())) {
			return new FileRenameResult("Cannot modify file extension. Please enter either the new name without file extension, or new name with the same extension");
		}
		
		if (!newExt.equals("")) {
			StringBuilder sb = new StringBuilder(newName);
			sb.replace(newName.lastIndexOf(newExt), newName.lastIndexOf(newExt) + newExt.length(), previousExt );
			newName = sb.toString();
		} else if (!previousExt.equals("")) {
			newName += '.' + previousExt;
		}
		
		String newPath = previousFile.getParent() + '/' + newName;
		
		if (newPath.equals(Utils.homeDir + filePath)) return new FileRenameResult("File name is the same as before");
		
		File newFile = new File(newPath);
		if (newFile.exists()) return new FileRenameResult("There is already a file in the directory called " + newName);
		
		if (previousFile.renameTo(newFile)) {
			return new FileRenameResult(newFile, Utils.homeDir);
		} else {
			return new FileRenameResult("Internal Server error. Please try again later");
		}
	}
	
	@PostMapping("/move_file")
	public FileRenameResult moveFile(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new FileRenameResult("Not autorized.");
		}
		
		String filePath = (String)payload.get("filePath");
		String newPath = (String)payload.get("newPath");
		if (filePath == null) return new FileRenameResult("The request is not complete");
		
		filePath = Utils.homeDir + filePath;
		if (newPath == null) {
			Boolean deleteFile = (Boolean)payload.get("delete");
			boolean delete = deleteFile == null ? false : deleteFile;
			if (delete) {
				newPath = Utils.homeDir + Utils.RECYCLE_BIN_FOLDER_NAME + File.separator + System.currentTimeMillis() + "_";
			} else {
				newPath = Utils.homeDir;
			}
		} else {
			newPath = Utils.homeDir + newPath + File.separator;
		}
		
		String[] paths = filePath.split("/");
		String originalName = paths[paths.length - 1];
		newPath += originalName;
		
		if (filePath.equals(newPath)) {
			return new FileRenameResult("The file is already at the selected directory");
		}
		
		if ((new File(filePath)).renameTo((new File(newPath)))) {
			return new FileRenameResult(new File(newPath), Utils.homeDir);
		} else {
			return new FileRenameResult("Internal Server error. Please try again later");
		}
	}
	
	@PostMapping("/upload_file")
	public FileRetrieveResult uploadFiles(@RequestHeader("Authorization") String auth, @RequestParam("files") List<MultipartFile> files, @RequestParam(value = "dir", required=false) String dir, MultipartRequest request) {
		if (Utils.findUser(auth) == null) {
			return new FileRetrieveResult("Not autorized.");
		}
		
		String errorMessage = "";
		List<Shareable> fileList = new ArrayList<>();
		
		for (MultipartFile file : files) {
			File uploadedFile = dir == null ? new File(Utils.homeDir + file.getOriginalFilename()): new File(Utils.homeDir + dir + File.separator + file.getOriginalFilename());
			
			try {
				file.transferTo(uploadedFile);
				fileList.add(new Shareable(uploadedFile, Utils.homeDir));
			} catch (Exception e) {
				errorMessage = "Some files are not uploaded successfully.";
			}
		}
		
		FileRetrieveResult response = new FileRetrieveResult(errorMessage);
		response.setFileList(fileList);
		
		return response;
		
	}

}
