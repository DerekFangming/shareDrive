package com.fmning.drive.service;

import com.fmning.drive.domain.Test;
import com.fmning.drive.repository.TestRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;
import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class TestService {

    private final TestRepo testRepo;
    private final File file;

    @PostConstruct
    public void checkStatus() {
        List<Test> tests = testRepo.findAll();
//        dataSource.get
        System.out.println("=============================== PPP " + tests.size());
    }

}
