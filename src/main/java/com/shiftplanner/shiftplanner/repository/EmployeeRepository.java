package com.shiftplanner.shiftplanner.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shiftplanner.shiftplanner.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

}