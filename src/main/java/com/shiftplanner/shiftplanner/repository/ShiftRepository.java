package com.shiftplanner.shiftplanner.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shiftplanner.shiftplanner.entity.Shift;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

}
