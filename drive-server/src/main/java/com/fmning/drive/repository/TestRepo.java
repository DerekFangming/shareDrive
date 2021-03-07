package com.fmning.drive.repository;

import com.fmning.drive.domain.Test;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepo extends CrudRepository<Test, Integer> {
    List<Test> findAll();
}
