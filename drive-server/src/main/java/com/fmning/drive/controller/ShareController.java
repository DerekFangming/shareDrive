package com.fmning.drive.controller;

import com.fmning.drive.DriveProperties;
import com.fmning.drive.SsoUser;
import com.fmning.drive.domain.Share;
import com.fmning.drive.repository.ShareRepo;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.fmning.drive.FileUtil.getFilePath;
import static com.fmning.drive.FileUtil.getInnerFolder;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class ShareController {

    private final File rootDir;
    private final ShareRepo shareRepo;
    private final DriveProperties driveProperties;

    @GetMapping()
    @PreAuthorize("hasRole('DR')")
    public List<Share> listShares() {
        return shareRepo.findAll();
    }

    @PostMapping()
    @PreAuthorize("hasRole('DR')")
    public Share createShare(@RequestBody Share share) {
        File file = getInnerFolder(rootDir, share.getFile());
        if (!file.exists()) {
            throw new IllegalArgumentException("The file does not exist");
        } else if (file.isFile() && share.isWriteAccess()) {
            throw new IllegalArgumentException("Shared file does not allow uploading.");
        }
        share.setId(RandomStringUtils.randomAlphanumeric(6));
        share.setCreated(Instant.now());

        if (driveProperties.isProduction()) {
            SsoUser user = (SsoUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            share.setCreatorName(user.getName());
            share.setCreatorId(user.getUserName());
        } else {
            share.setCreatorName("anonymousUser");
            share.setCreatorId("anonymousUserId");
        }
        shareRepo.save(share);
        return share;
    }

    @PutMapping()
    @PreAuthorize("hasRole('DR')")
    public Share updateShare(@RequestBody Share updatedShare) {
        Optional<Share> shareOpt = shareRepo.findById(updatedShare.getId());
        if (!shareOpt.isPresent()) {
            throw new IllegalArgumentException("Share not found");
        }

        Share share = shareOpt.get();
        share.setName(updatedShare.getName());
        share.setExpiration(updatedShare.getExpiration());
        share.setWriteAccess(updatedShare.isWriteAccess());
        shareRepo.save(share);
        return share;
    }

    @DeleteMapping("/{shareId}")
    @PreAuthorize("hasRole('DR')")
    public ResponseEntity<Void> deleteShare(@PathVariable(value="shareId") String id) {
        Optional<Share> share = shareRepo.findById(id);
        if (share.isPresent()) {
            shareRepo.deleteById(id);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        throw new IllegalArgumentException("Share not found");
    }

}
