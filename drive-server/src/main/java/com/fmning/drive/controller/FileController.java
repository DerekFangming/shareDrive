package com.fmning.drive.controller;

import com.fmning.drive.FileUtil;
import com.fmning.drive.dto.Shareable;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static com.fmning.drive.FileUtil.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class FileController {

    private final File rootDir;
    private static final String DOWNLOAD_FILE = "download-file";
    private static final String DELETE_FILE = "delete-file";
    private static final int DEFAULT_BUFFER_BYTE_SIZE = 20480;

    @GetMapping("/" + DOWNLOAD_FILE + "/**")
    public void getFile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        File file = getInnerFolder(rootDir, getFilePath(request, DOWNLOAD_FILE));

        if (file.isDirectory()) {
            throw new IllegalArgumentException("Cannot download a directory");
        } else if (!file.isFile()) {
            throw new IllegalArgumentException("The file does not exist");
        }

        String contentType= URLConnection.guessContentTypeFromName(file.getName());
        if (contentType == null) contentType = "application/octet-stream";
        String encodedFileName = URLEncoder.encode(file.getName(), StandardCharsets.UTF_8.name()).replace("+", "%20").replace("%28", "(").replace("%29", ")")
                .replace("%5B", "[").replace("%5D", "]");

        long length = file.length();
        Range full = Range.builder().start(0).end(length - 1).length(length).total(length).build();
        List<Range> ranges = new ArrayList<>();

        String range = request.getHeader(HttpHeaders.RANGE);
        if (range != null) {
            if (!range.matches("^bytes=\\d*-\\d*(,\\d*-\\d*)*$")) {
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + length);
                response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                return;
            }

            for (String part : range.substring(6).split(",")) {
                long start = FileUtil.sublong(part, 0, part.indexOf("-"));
                long end = FileUtil.sublong(part, part.indexOf("-") + 1, part.length());

                if (start == -1) {
                    start = length - end;
                    end = length - 1;
                } else if (end == -1 || end > length - 1) {
                    end = length - 1;
                }

                if (start > end) {
                    response.setHeader("Content-Range", "bytes */" + length);
                    response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                    return;
                }

                ranges.add(Range.builder().start(start).end(end).length(end - start + 1).total(length).build());
            }
        }

        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setBufferSize(DEFAULT_BUFFER_BYTE_SIZE);
        response.setContentType(contentType);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"");
        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setHeader(HttpHeaders.ETAG, "\"" + file.getName() + "\"");

        try (InputStream input = new BufferedInputStream(new FileInputStream(file));
             OutputStream output = response.getOutputStream()) {
            if (ranges.isEmpty() || ranges.get(0) == full) {
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + full.start + "-" + full.end + "/" + full.total);
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(full.length));
                copyFileStream(input, output, length, full.start, full.length);
            } else if (ranges.size() == 1) {
                Range r = ranges.get(0);
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + r.start + "-" + r.end + "/" + r.total);
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(r.length));
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
                copyFileStream(input, output, length, r.start, r.length);
            } else {
                response.setContentType("multipart/byteranges; boundary=MULTIPART_BYTERANGES");
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
                for (Range r : ranges) {
                    copyFileStream(input, output, length, r.start, r.length);
                }
            }
        }
    }

    @PutMapping("/rename-file")
    public Shareable renameFile(@RequestBody Shareable shareable) {
        if (shareable == null || shareable.getPath() == null ) {
            throw new IllegalArgumentException("The request is invalid");
        } else if (isNameInvalid(shareable.getName())) {
            throw new IllegalArgumentException("File name cannot contain characters like / ` ? * \\ < > | \" :");
        }

        File previousFile = getInnerFolder(rootDir, shareable.getPath());
        if (!previousFile.exists()) throw new IllegalArgumentException("The file you are trying to rename does not exist");
        String previousExt = FilenameUtils.getExtension(previousFile.getPath());
        String newName = shareable.getName();
        String newExt = FilenameUtils.getExtension(newName);

        if (!newExt.equals("") && !previousExt.toLowerCase().equals(newExt.toLowerCase())) {
            throw new IllegalArgumentException("Cannot modify file extension. Please enter either the new name without file extension, or new name with the same extension");
        }

        if (!newExt.equals("")) {
            StringBuilder sb = new StringBuilder(newName);
            sb.replace(newName.lastIndexOf(newExt), newName.lastIndexOf(newExt) + newExt.length(), previousExt );
            newName = sb.toString();
        } else if (!previousExt.equals("")) {
            newName += '.' + previousExt;
        }

        String newPath = previousFile.getParent() + File.separator + newName;
        if (newPath.equals(previousFile.getPath())) throw new IllegalArgumentException("File name is the same as before");

        File newFile = new File(newPath);
        if (newFile.exists()) throw new IllegalArgumentException("There is already a file in the directory called " + newName);

        if (previousFile.renameTo(newFile)) {
            return toShareable(rootDir, newFile);
        } else {
            throw new IllegalArgumentException("Failed to rename file.");
        }
    }

    @DeleteMapping("/" + DELETE_FILE + "/**")
    public ResponseEntity<Void> deleteFile(HttpServletRequest request) {
        File file = getInnerFolder(rootDir, getFilePath(request, DELETE_FILE));
        if (!file.exists()) throw new IllegalArgumentException("The file you are trying to delete does not exist");

        if (file.delete()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            throw new IllegalArgumentException("Failed to DELETE file.");
        }
    }

    @Data
    @Builder
    private static class Range {
        public long start;
        public long end;
        public long length;
        public long total;
    }

    private void copyFileStream(InputStream input, OutputStream output, long inputSize, long start, long length) throws IOException {
        byte[] buffer = new byte[DEFAULT_BUFFER_BYTE_SIZE];
        int read;

        if (inputSize == length) {
            while ((read = input.read(buffer)) > 0) {
                output.write(buffer, 0, read);
                output.flush();
            }
        } else {
            input.skip(start);
            long toRead = length;

            while ((read = input.read(buffer)) > 0) {
                if ((toRead -= read) > 0) {
                    output.write(buffer, 0, read);
                    output.flush();
                } else {
                    output.write(buffer, 0, (int) toRead + read);
                    output.flush();
                    break;
                }
            }
        }
    }

}
