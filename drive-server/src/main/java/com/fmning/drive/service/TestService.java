package com.fmning.drive.service;

import com.fmning.drive.domain.Share;
import com.fmning.drive.repository.ShareRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class TestService {

    private final ShareRepo shareRepo;
    private final File file;

    @PostConstruct
    public void checkStatus() {
        List<Share> tests = shareRepo.findAll();
//        dataSource.get
        System.out.println("=============================== PPP " + tests.size());
    }

}
