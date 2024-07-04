package com.fmning.drive;

import com.fmning.drive.domain.Share;
import com.fmning.drive.repository.ShareRepo;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping(value = "/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class TestController {

    private final ShareRepo shareRepo;

    @GetMapping("/ping")
    public String ping() {
        throw new IllegalStateException("something is wrong");
//        return DriveConfiguration.driveStatus.name();
    }
    @GetMapping("/ping1")
    public String ping1() {
        shareRepo.save(Share.builder()
                .id(RandomStringUtils.randomAlphanumeric(6))
                .path("file directory")
                .expiration(Instant.now().plusSeconds(99999))
                .created(Instant.now())
                .creatorId("synfm@126.com")
                .creatorName("Derek")
                .build());
//        List<Test> tests = testRepo.findAll();
//        System.out.println(tests.size());
        return "pong";
    }
}
