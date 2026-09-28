package com.shiftplanner.shiftplanner.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shiftplanner.shiftplanner.entity.Employee;
import com.shiftplanner.shiftplanner.entity.Roster;
import com.shiftplanner.shiftplanner.entity.SwapRequest;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

    void deleteByRequesterOrColleague(Employee requester, Employee colleague);

    void deleteByRoster(Roster roster);
}