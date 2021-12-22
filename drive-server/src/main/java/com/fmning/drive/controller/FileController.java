package com.fmning.drive.controller;

import com.fmning.drive.FileUtil;
import com.fmning.drive.domain.Share;
import com.fmning.drive.dto.MoveFile;
import com.fmning.drive.dto.Shareable;
import com.fmning.drive.dto.UploadResult;
import com.fmning.drive.repository.ShareRepo;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.fmning.drive.FileUtil.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class FileController {

    private final File rootDir;
    private final ShareRepo shareRepo;

    private static final String DOWNLOAD_FILE = "download-file";
    private static final String DOWNLOAD_SHARED_FILE = "download-shared-file";
    private static final String DELETE_FILE = "delete-file";
    private static final String UPLOAD_FILE = "upload-file";
    private static final String UPLOAD_SHARED_FILE = "upload-shared-file";
    private static final String SEARCH_FILE = "search-file";
    private static final int DEFAULT_BUFFER_BYTE_SIZE = 20480;

    @GetMapping("/" + DOWNLOAD_SHARED_FILE + "/**")
    public void downloadSharedFile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = getFilePath(request, DOWNLOAD_SHARED_FILE).substring(1);
        if (StringUtils.isBlank(path)) {
            throw new IllegalArgumentException("No share code is provided");
        }
        String[] paths = path.split("/", 2);
        String shareId = paths[0];
        String subPath = paths.length == 2 ? paths[1] : "";

        Share share = shareRepo.findById(shareId).orElse(null);
        if (share == null) {
            throw new IllegalArgumentException("Share code " + shareId + " does not exist.");
        } else if (share.getExpiration() != null && share.getExpiration().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Share code " + shareId + " has expired.");
        }

        File file = getInnerFolder(rootDir, share.getPath() + "/" + subPath);
        downloadFile(request, response, file);
    }

    @GetMapping("/" + DOWNLOAD_FILE + "/**")
    @PreAuthorize("hasRole('DR')")
    public void downloadFile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        File file = getInnerFolder(rootDir, getFilePath(request, DOWNLOAD_FILE));
        downloadFile(request, response, file);
    }

    private void downloadFile(HttpServletRequest request, HttpServletResponse response, File file) throws IOException {
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

    @PostMapping("/" + UPLOAD_SHARED_FILE + "/**")
    public UploadResult uploadSharedFile(@RequestParam(value = "files", required=false) List<MultipartFile> files, HttpServletRequest request) throws IOException {
        String path = getFilePath(request, UPLOAD_SHARED_FILE).substring(1);
        if (StringUtils.isBlank(path)) {
            throw new IllegalArgumentException("No share code is provided");
        }
        String[] paths = path.split("/", 2);
        String shareId = paths[0];
        String subPath = paths.length == 2 ? paths[1] : "";

        Share share = shareRepo.findById(shareId).orElse(null);
        if (share == null) {
            throw new IllegalArgumentException("Share code " + shareId + " does not exist.");
        } else if (share.getExpiration() != null && share.getExpiration().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Share code " + shareId + " has expired.");
        } else if (!share.isWriteAccess()) {
            throw new IllegalArgumentException("This shared directory is read only. Uploading is not allowed.");
        }

        File folder = getInnerFolder(rootDir, share.getPath() + "/" + subPath);
        File shareRoot = getInnerFolder(rootDir, share.getPath());
        return uploadFiles(folder, files, shareRoot, share.getId());
    }

    @PostMapping("/" + UPLOAD_FILE + "/**")
    @PreAuthorize("hasRole('DR')")
    public UploadResult uploadFiles(@RequestParam(value = "files", required=false) List<MultipartFile> files, HttpServletRequest request) {
        File folder = getInnerFolder(rootDir, getFilePath(request, UPLOAD_FILE));
        return uploadFiles(folder, files, null, null);
    }

    public UploadResult uploadFiles(File folder, List<MultipartFile> files, File shareRoot, String shareId) {
        if (!folder.exists()) {
            throw new IllegalArgumentException("The folder does not exist");
        } else if (!folder.isDirectory()) {
            throw new IllegalArgumentException("Invalid upload path.");
        }

        String error = "";
        List<Shareable> shareables = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.getOriginalFilename() == null) continue;
            File targetFile = getInnerFolder(folder, file.getOriginalFilename());
            if (targetFile.exists()) {
                error += "File named " + file.getOriginalFilename() + " failed to upload because it already exists in the directory;";
            } else {
                try {
                    file.transferTo(targetFile);
                    targetFile.setReadable(true, false);
                    targetFile.setExecutable(true, false);
                    targetFile.setWritable(true, false);
                    if (shareRoot == null) {
                        shareables.add(toShareable(rootDir, targetFile));
                    } else {
                        shareables.add(toShareable(shareId + "/" + getRelativePath(targetFile, shareRoot), targetFile));
                    }
                } catch (Exception e) {
                    error += "File named " + file.getOriginalFilename() + " failed to be uploaded, " + e.getMessage() + ";";
                }
            }
        }

        return UploadResult.builder()
                .error(error)
                .files(shareables)
                .build();
    }

    @PutMapping("/rename-file")
    @PreAuthorize("hasRole('DR')")
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

    @PostMapping("/move-file")
    @PreAuthorize("hasRole('DR')")
    public ResponseEntity<Void> moveFile(@RequestBody MoveFile moveFile) {
        if (moveFile.getPath() == null) {
            throw new IllegalArgumentException("Please provide the file.");
        } else if (moveFile.getTargetPath() == null) {
            throw new IllegalArgumentException("Please provide the target location.");
        }

        File file = getInnerFolder(rootDir, moveFile.getPath());
        File targetFolder = getInnerFolder(rootDir, moveFile.getTargetPath());

        if (!file.exists()) {
            throw new IllegalArgumentException("Provided file does not exist.");
        } else if (!targetFolder.exists()) {
            throw new IllegalArgumentException("Provided target location does not exist.");
        } else if (!targetFolder.isDirectory()) {
            throw new IllegalArgumentException("Provided target location is not a folder.");
        }

        File targetFile = getInnerFolder(targetFolder, file.getName());
        if (targetFile.exists()) {
            throw new IllegalArgumentException("Target location already has a file called " + file.getName());
        }

        if (file.renameTo(targetFile)) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            throw new IllegalArgumentException("Failed to move file.");
        }
    }

    @DeleteMapping("/" + DELETE_FILE + "/**")
    @PreAuthorize("hasRole('DR')")
    public ResponseEntity<Void> deleteFile(HttpServletRequest request) {
        File file = getInnerFolder(rootDir, getFilePath(request, DELETE_FILE));


        if (file.delete()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            throw new IllegalArgumentException("Failed to DELETE file.");
        }
    }

    @GetMapping("/" + SEARCH_FILE + "/**")
    @PreAuthorize("hasRole('DR')")
    public List<Shareable> searchFiles(@RequestParam("keyword") String keyword, HttpServletRequest request) {
        File folder = getInnerFolder(rootDir, getFilePath(request, SEARCH_FILE));
        if (!folder.exists()) throw new IllegalArgumentException("Search path does not exist.");
        else if (!folder.isDirectory()) throw new IllegalArgumentException("Search path is not a directory.");

        keyword = keyword.trim();
        if (keyword.equals("")) {
            throw new IllegalArgumentException("Please enter a keyword.");
        }

        try {
            String regex = ".*" + keyword.toLowerCase().replace(".", "\\.").replace("*", ".*").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
                    .replace("/", "\\/").replace("$", "\\$").replace("^", "\\^").replace("+", "\\+").replace("[", "\\[").replace("]", "\\]").replace("|", "\\|")
                    .replace("?", "\\?")+ ".*";
            List<Shareable> resultList = Files.walk(folder.toPath())
                    .map(Path::toFile)
                    .parallel()
                    .filter(p -> p.getName().toLowerCase().matches(regex))
                    .map(f -> toShareable(rootDir, f))
                    .collect(Collectors.toList());

            return resultList;
        } catch (IOException e) {
            throw new IllegalArgumentException(e.getMessage());
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
