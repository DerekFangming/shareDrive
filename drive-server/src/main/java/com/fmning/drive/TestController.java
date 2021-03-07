package com.fmning.drive;

import com.fmning.drive.domain.Test;
import com.fmning.drive.repository.TestRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping(value = "/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class TestController {

    private final TestRepo testRepo;

    @GetMapping("/ping")
    public String ping() {
        return DriveConfiguration.driveStatus.name();
    }
    @GetMapping("/ping1")
    public String ping1() {
        testRepo.save(Test.builder().content("1").created(Instant.now()).build());
        List<Test> tests = testRepo.findAll();
        System.out.println(tests.size());
        return "pong";
    }
}
