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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
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
    private static final long MIN_STORAGE_WRITE_TIMEOUT_MS = 60_000L;
    private static final long MAX_STORAGE_WRITE_TIMEOUT_MS = 600_000L;
    private static final ExecutorService STORAGE_EXECUTOR = Executors.newCachedThreadPool(r -> {
        Thread thread = new Thread(r, "drive-storage-io");
        thread.setDaemon(true);
        return thread;
    });

    @GetMapping("/" + DOWNLOAD_SHARED_FILE + "/**")
    public void downloadSharedFile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = getFilePath(request, DOWNLOAD_SHARED_FILE);
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
    @PreAuthorize("hasAuthority('DR')")
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

        long length = file.length();
        String contentType = URLConnection.guessContentTypeFromName(file.getName());
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        String fileName = file.getName();
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        List<Range> ranges = parseRanges(request.getHeader(HttpHeaders.RANGE), length);
        if (ranges == null) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + length);
            response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
            return;
        }

        response.setBufferSize(256 * 1024);
        response.setContentType(contentType);
        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setHeader(HttpHeaders.CACHE_CONTROL, "private, no-transform");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + fileName.replace("\"", "") + "\"; filename*=UTF-8''" + encodedFileName);
        response.setHeader(HttpHeaders.ETAG, "\"" + length + "-" + file.lastModified() + "\"");

        try (RandomAccessFile raf = new RandomAccessFile(file, "r");
             OutputStream output = new BufferedOutputStream(response.getOutputStream(), 256 * 1024)) {
            if (ranges.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_OK);
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(length));
                if (length > 0) {
                    copyFileRange(raf, output, 0, length);
                }
            } else if (ranges.size() == 1) {
                Range r = ranges.get(0);
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + r.start + "-" + r.end + "/" + r.total);
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(r.length));
                copyFileRange(raf, output, r.start, r.length);
            } else {
                response.setContentType("multipart/byteranges; boundary=MULTIPART_BYTERANGES");
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
                for (Range r : ranges) {
                    output.write(("--MULTIPART_BYTERANGES\r\n").getBytes(StandardCharsets.UTF_8));
                    output.write(("Content-Type: " + contentType + "\r\n").getBytes(StandardCharsets.UTF_8));
                    output.write(("Content-Range: bytes " + r.start + "-" + r.end + "/" + r.total + "\r\n\r\n")
                            .getBytes(StandardCharsets.UTF_8));
                    copyFileRange(raf, output, r.start, r.length);
                    output.write("\r\n".getBytes(StandardCharsets.UTF_8));
                }
                output.write("--MULTIPART_BYTERANGES--\r\n".getBytes(StandardCharsets.UTF_8));
            }
            output.flush();
        } catch (IOException e) {
            // Browser navigated away / cancelled download — not a server failure.
            if (!isClientAbort(e)) {
                throw e;
            }
        }
    }

    /**
     * @return empty list for full file, parsed ranges for partial content, or null if the Range header is invalid
     */
    private List<Range> parseRanges(String rangeHeader, long length) {
        List<Range> ranges = new ArrayList<>();
        if (rangeHeader == null) {
            return ranges;
        }
        if (!rangeHeader.matches("^bytes=\\d*-\\d*(,\\d*-\\d*)*$")) {
            return null;
        }

        for (String part : rangeHeader.substring(6).split(",")) {
            long start = FileUtil.sublong(part, 0, part.indexOf("-"));
            long end = FileUtil.sublong(part, part.indexOf("-") + 1, part.length());

            if (start == -1) {
                start = Math.max(0, length - end);
                end = length - 1;
            } else if (end == -1 || end > length - 1) {
                end = length - 1;
            }

            if (length == 0) {
                continue;
            }
            if (start > end || start >= length) {
                return null;
            }

            ranges.add(Range.builder().start(start).end(end).length(end - start + 1).total(length).build());
        }
        return ranges;
    }

    private void copyFileRange(RandomAccessFile raf, OutputStream output, long start, long length) throws IOException {
        byte[] buffer = new byte[256 * 1024];
        raf.seek(start);
        long remaining = length;
        while (remaining > 0) {
            int toRead = (int) Math.min(buffer.length, remaining);
            int read = raf.read(buffer, 0, toRead);
            if (read < 0) {
                throw new IOException("Unexpected end of file while reading download content");
            }
            output.write(buffer, 0, read);
            remaining -= read;
        }
    }

    private boolean isClientAbort(IOException e) {
        Throwable cause = e;
        while (cause != null) {
            String name = cause.getClass().getSimpleName();
            if ("ClientAbortException".equals(name) || "EofException".equals(name)) {
                return true;
            }
            String message = cause.getMessage();
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("broken pipe")
                        || lower.contains("connection reset")
                        || lower.contains("connection abort")
                        || lower.contains("clientabort")) {
                    return true;
                }
            }
            cause = cause.getCause();
        }
        return false;
    }

    @PostMapping("/" + UPLOAD_SHARED_FILE + "/**")
    public UploadResult uploadSharedFile(@RequestParam(value = "files", required=false) List<MultipartFile> files, HttpServletRequest request) throws IOException {
        String path = getFilePath(request, UPLOAD_SHARED_FILE);
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
    @PreAuthorize("hasAuthority('DR')")
    public UploadResult uploadFiles(@RequestParam(value = "files", required=false) List<MultipartFile> files, HttpServletRequest request) {
        File folder = getInnerFolder(rootDir, getFilePath(request, UPLOAD_FILE));
        return uploadFiles(folder, files, null, null);
    }

    public UploadResult uploadFiles(File folder, List<MultipartFile> files, File shareRoot, String shareId) {
        if (!folder.exists()) {
            throw new IllegalArgumentException("The folder does not exist");
        } else if (!folder.isDirectory()) {
            throw new IllegalArgumentException("Invalid upload path.");
        } else if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No files are provided.");
        }

        String error = "";
        List<Shareable> shareables = new ArrayList<>();

        for (MultipartFile file : files) {
            String fileName = FilenameUtils.getName(file.getOriginalFilename());
            if (StringUtils.isBlank(fileName) || isNameInvalid(fileName)) {
                error += "File named " + file.getOriginalFilename() + " failed to upload because the file name is invalid;";
                continue;
            }
            if (file.isEmpty()) {
                error += "File named " + fileName + " failed to upload because it is empty;";
                continue;
            }

            File targetFile = getInnerFolder(folder, fileName);
            if (targetFile.exists()) {
                error += "File named " + fileName + " failed to upload because it already exists in the directory;";
                continue;
            }

            File tempFile = null;
            boolean committed = false;
            try {
                // Stage on local disk first. Writing temp files directly into a mounted
                // share often stalls uploads and freezes client progress.
                tempFile = Files.createTempFile("drive-upload-", ".tmp").toFile();
                file.transferTo(tempFile);

                if (file.getSize() > 0 && tempFile.length() != file.getSize()) {
                    throw new IOException("Incomplete upload: expected " + file.getSize() + " bytes but received " + tempFile.length());
                }

                // Copy onto the share with a timeout. A stuck mount previously left
                // clients hanging at 99% waiting for the HTTP response.
                commitUploadedFile(tempFile.toPath(), targetFile.toPath(), file.getSize());
                tempFile = null;
                committed = true;

                targetFile.setReadable(true, false);
                targetFile.setExecutable(true, false);
                targetFile.setWritable(true, false);
                if (shareRoot == null) {
                    shareables.add(toShareable(rootDir, targetFile));
                } else {
                    shareables.add(toShareable(shareId + "/" + getRelativePath(targetFile, shareRoot), targetFile));
                }
            } catch (Exception e) {
                error += "File named " + fileName + " failed to be uploaded, " + e.getMessage() + ";";
                if (tempFile != null && tempFile.exists() && !tempFile.delete()) {
                    tempFile.deleteOnExit();
                }
                if (!committed && targetFile.exists() && !targetFile.delete()) {
                    targetFile.deleteOnExit();
                }
            }
        }

        return UploadResult.builder()
                .error(error)
                .files(shareables)
                .build();
    }

    private void commitUploadedFile(Path source, Path target, long fileSize) throws IOException {
        long timeoutMs = Math.min(
                Math.max(MIN_STORAGE_WRITE_TIMEOUT_MS, fileSize / 50_000L),
                MAX_STORAGE_WRITE_TIMEOUT_MS
        );

        Future<Void> future = STORAGE_EXECUTOR.submit(() -> {
            writeToStorage(source, target);
            return null;
        });

        try {
            future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            deleteQuietly(target);
            throw new IOException("Timed out while saving file to storage. The storage may be slow or unavailable.");
        } catch (ExecutionException e) {
            deleteQuietly(target);
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            if (cause instanceof IOException) {
                throw (IOException) cause;
            }
            throw new IOException("Failed to save file to storage: " + cause.getMessage(), cause);
        } catch (InterruptedException e) {
            future.cancel(true);
            Thread.currentThread().interrupt();
            deleteQuietly(target);
            throw new IOException("Interrupted while saving file to storage");
        }
    }

    private void writeToStorage(Path source, Path target) throws IOException {
        try {
            Files.move(source, target,
                    java.nio.file.StandardCopyOption.ATOMIC_MOVE,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return;
        } catch (IOException ignored) {
            // Fall through to stream copy for cross-filesystem / mounted shares.
        }

        try (InputStream in = Files.newInputStream(source);
             OutputStream out = Files.newOutputStream(target,
                     StandardOpenOption.CREATE,
                     StandardOpenOption.TRUNCATE_EXISTING,
                     StandardOpenOption.WRITE)) {
            byte[] buffer = new byte[256 * 1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new IOException("Storage write interrupted");
                }
                out.write(buffer, 0, read);
            }
            out.flush();
        } catch (IOException e) {
            deleteQuietly(target);
            throw e;
        }
        Files.deleteIfExists(source);
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (Exception ignored) {
            // best effort cleanup
        }
    }

    @PutMapping("/rename-file")
    @PreAuthorize("hasAuthority('DR')")
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
    @PreAuthorize("hasAuthority('DR')")
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
    @PreAuthorize("hasAuthority('DR')")
    public ResponseEntity<Void> deleteFile(HttpServletRequest request) {
        File file = getInnerFolder(rootDir, getFilePath(request, DELETE_FILE));


        if (file.delete()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            throw new IllegalArgumentException("Failed to DELETE file.");
        }
    }

    @GetMapping("/" + SEARCH_FILE + "/**")
    @PreAuthorize("hasAuthority('DR')")
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
                    .filter(f -> !isUnderRecycleFolder(f, rootDir))
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

}
