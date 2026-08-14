package com.fmning.drive;

import com.fmning.drive.dto.Shareable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;

public class FileUtil {

    private static final String RECYCLE_FOLDER = "#recycle";

    public static boolean isListable(File file) {
        String name = file.getName();
        return !file.isHidden()
                && !name.startsWith(".")
                && !name.startsWith("$")
                && !RECYCLE_FOLDER.equals(name);
    }

    public static boolean isUnderRecycleFolder(File file, File rootDir) {
        String relative = getRelativePath(file, rootDir).replace("\\", "/");
        return relative.equals(RECYCLE_FOLDER) || relative.startsWith(RECYCLE_FOLDER + "/");
    }

    /**
     * Resolves {@code path} under {@code baseFolder} and rejects anything that escapes it
     * (e.g. {@code ..} segments, absolute paths, symlink escapes).
     */
    public static File getInnerFolder(File baseFolder, String path) {
        return resolveWithin(baseFolder, path);
    }

    /**
     * Resolves a shared item path: must stay under the drive root and under the share root.
     */
    public static File resolveSharedPath(File driveRoot, String sharePath, String subPath) {
        File shareRoot = resolveWithin(driveRoot, sharePath);
        if (StringUtils.isBlank(subPath)) {
            return shareRoot;
        }
        return resolveWithin(shareRoot, subPath);
    }

    public static File resolveWithin(File baseFolder, String path) {
        if (baseFolder == null) {
            throw new IllegalArgumentException("Access denied: path is outside the allowed directory");
        }
        if (path == null) {
            path = "";
        }
        if (path.indexOf('\0') >= 0) {
            throw new IllegalArgumentException("Invalid path");
        }

        // Keep the path relative to the base. Absolute segments would ignore the base on Unix.
        while (path.startsWith("/") || path.startsWith("\\")) {
            path = path.substring(1);
        }

        try {
            File base = baseFolder.getCanonicalFile();
            File target = new File(base, path).getCanonicalFile();
            if (!isContained(base, target)) {
                throw new IllegalArgumentException("Access denied: path is outside the allowed directory");
            }
            return target;
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid path");
        }
    }

    public static void assertContained(File baseFolder, File target) {
        try {
            if (baseFolder == null || target == null || !isContained(baseFolder.getCanonicalFile(), target.getCanonicalFile())) {
                throw new IllegalArgumentException("Access denied: path is outside the allowed directory");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid path");
        }
    }

    public static boolean isContained(File base, File target) throws IOException {
        Path basePath = base.getCanonicalFile().toPath();
        Path targetPath = target.getCanonicalFile().toPath();
        return targetPath.startsWith(basePath);
    }

    public static String getRelativePath(File file, File rootDir) {
        String root = rootDir.getPath().replace("\\", "/") + "/";
        return file.getPath().replace("\\", "/").replaceFirst(root, "");
    }

    public static long getCreationTime(File file) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(file.toPath(), BasicFileAttributes.class);
            return attributes.creationTime().toMillis();
        } catch (IOException e) {
            return 0;
        }
    }

    public static String getFilePath(HttpServletRequest request, String basePath) {
        String path = new AntPathMatcher().extractPathWithinPattern((String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE), request.getRequestURI());
        try {
            return URLDecoder.decode(path, StandardCharsets.UTF_8.name()).replaceFirst(basePath, "");
        } catch (Exception e){
            throw new IllegalArgumentException("Failed to parse request");
        }
    }

    public static long sublong(String value, int beginIndex, int endIndex) {
        String substring = value.substring(beginIndex, endIndex);
        return (substring.length() > 0) ? Long.parseLong(substring) : -1;
    }

    public static boolean isNameInvalid(String name) {
        if (StringUtils.isBlank(name)) {
            return true;
        } else {
            return name.matches(".*[/\n\r\t\0\f`?*<>|\":].*");
        }
    }

    public static Shareable toShareable(String relativePath, File file) {
        return Shareable.builder()
                .name(file.getName())
                .path(relativePath)
                .isFile(file.isFile())
                .created(getCreationTime(file))
                .lastModified(file.lastModified())
                .size(file.isFile() ? file.length() : 0)
                .build();
    }

    public static Shareable toShareable(File rootDir, File file) {
        return Shareable.builder()
                .name(file.getName())
                .path(getRelativePath(file, rootDir))
                .isFile(file.isFile())
                .created(getCreationTime(file))
                .lastModified(file.lastModified())
                .size(file.isFile() ? file.length() : 0)
                .build();
    }

}
