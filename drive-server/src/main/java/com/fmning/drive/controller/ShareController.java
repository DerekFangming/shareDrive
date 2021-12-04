package com.fmning.drive.controller;

import com.fmning.drive.DriveProperties;
import com.fmning.drive.domain.Share;
import com.fmning.drive.repository.ShareRepo;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class ShareController {

    private final ShareRepo shareRepo;
    private final DriveProperties driveProperties;

    @GetMapping()
    @PreAuthorize("hasRole('DR')")
    public List<Share> listShares() {
        return shareRepo.findAll();
    }

    @PostMapping()
    @PreAuthorize("hasRole('DR')")
    public Share createShare(Share share) {
        share.setId(RandomStringUtils.randomAlphanumeric(6));
        share.setCreated(Instant.now());
//        shareRepo.save(Share.builder()
//                .id(RandomStringUtils.randomAlphanumeric(6))
//                .file("file directory")
//                .expiration(Instant.now().plusSeconds(99999))
//                .created(Instant.now())
//                .creatorId("synfm@126.com")
//                .creatorName("Derek")
//                .build());
        return share;
    }

//    @GetMapping("/{shareId}")
//    public Share loginRedirect(@PathVariable(value="shareId") String id) {
//        Optional<Share> share = shareRepo.findById(id);
//
//        return share.;
//    }
}
