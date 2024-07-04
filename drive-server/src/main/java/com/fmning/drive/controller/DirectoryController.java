package com.fmning.drive.controller;

import com.fmning.drive.domain.Share;
import com.fmning.drive.dto.Capacity;
import com.fmning.drive.dto.DirectorySize;
import com.fmning.drive.dto.Shareable;
import com.fmning.drive.repository.ShareRepo;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.fmning.drive.CORSFilter.SHARE_DETAILS;
import static com.fmning.drive.FileUtil.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class DirectoryController {

    private final File rootDir;
    private final ShareRepo shareRepo;
    private static final String DIRECTORY = "directory";
    private static final String SHARED_DIRECTORY = "shared-directory";
    public static final String DIRECTORY_SIZE = "directory-size";

    @GetMapping("/" + DIRECTORY + "/**")
    @PreAuthorize("hasAuthority('DR')")
    public List<Shareable> getFiles(HttpServletRequest request, @RequestParam(value = "dirOnly", required=false) boolean dirOnly) {
        File directory = getInnerFolder(rootDir, getFilePath(request, DIRECTORY));

        if (directory.isFile()) {
            throw new IllegalArgumentException("Requested path is not a directory.");
        } else if (!directory.isDirectory()) {
            throw new IllegalArgumentException("Requested path does not exist.");
        } else {
            return Arrays.stream(Objects.requireNonNull(directory.listFiles())).filter(f -> {
                if (!f.isHidden() && !f.getName().startsWith(".") && !f.getName().startsWith("$")) {
                    return !dirOnly || f.isDirectory();
                }
                return false;
            }).map(f -> toShareable(rootDir, f)).collect(Collectors.toList());
        }
    }

    @GetMapping("/" + SHARED_DIRECTORY + "/**")
    public ResponseEntity<List<Shareable>> getSharedFiles(HttpServletRequest request) {
        String path = getFilePath(request, SHARED_DIRECTORY).substring(1);
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

        File sharePoint = getInnerFolder(rootDir, share.getPath() + "/" + subPath);
        if (!sharePoint.exists()) {
            throw new IllegalArgumentException("Shared file does not exist.");
        }

        String details = sharePoint.isFile() ? "f:" : "d:";
        details += share.isWriteAccess() ? "rw" : "r";

        if (sharePoint.isFile()) {
            return ResponseEntity.ok()
                    .header(SHARE_DETAILS, details)
                    .body(Collections.singletonList(toShareable(share.getId(), sharePoint)));
        }
        if (sharePoint.isDirectory()) {
            File shareRoot = getInnerFolder(rootDir, share.getPath());
            return ResponseEntity.ok()
                    .header(SHARE_DETAILS, details)
                    .body(Arrays.stream(Objects.requireNonNull(sharePoint.listFiles()))
                            .filter(f -> !f.isHidden() && !f.getName().startsWith(".") && !f.getName().startsWith("$"))
                            .map(f -> toShareable(share.getId() + "/" + getRelativePath(f, shareRoot), f)).collect(Collectors.toList()));
        }

        throw new IllegalArgumentException("Internal error: Shared path does not contain file or directory.");
    }

    @GetMapping("/" + DIRECTORY_SIZE + "/**")
    @PreAuthorize("hasAuthority('DR')")
    public DirectorySize getDirectorySize(HttpServletRequest request) {
        File directory = getInnerFolder(rootDir, getFilePath(request, DIRECTORY_SIZE));

        if (directory.isFile()) {
            throw new IllegalArgumentException("Requested path is not a directory.");
        } else if (!directory.isDirectory()) {
            throw new IllegalArgumentException("Requested path does not exist.");
        } else {
            return DirectorySize.builder().size(FileUtils.sizeOfDirectory(directory)).build();
        }
    }

    @GetMapping("/capacity")
    @PreAuthorize("hasAuthority('DR')")
    public Capacity getCapacity() {
        return Capacity.builder().totalSpace(rootDir.getTotalSpace()).availableSpace(rootDir.getUsableSpace()).build();
    }

    @PostMapping("/directory")
    @PreAuthorize("hasAuthority('DR')")
    public Shareable createDirectory(@RequestBody Shareable shareable) {
        if (shareable == null || shareable.getPath() == null ) {
            throw new IllegalArgumentException("The request is invalid");
        } else if (isNameInvalid(shareable.getName())) {
            throw new IllegalArgumentException("File name cannot contain characters like / ` ? * \\ < > | \" :");
        }

        File newDir = getInnerFolder(rootDir, shareable.getPath());
        if (newDir.exists()) {
            throw new IllegalArgumentException("The folder already exits");
        }

        if (newDir.mkdirs()) {
            newDir.setReadable(true, false);
            newDir.setExecutable(true, false);
            newDir.setWritable(true, false);
            return toShareable(rootDir, newDir);
        } else {
            throw new IllegalArgumentException("Failed to create folder.");
        }
    }

}
