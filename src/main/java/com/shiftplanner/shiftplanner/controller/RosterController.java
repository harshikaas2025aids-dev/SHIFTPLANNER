package com.shiftplanner.shiftplanner.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shiftplanner.shiftplanner.entity.Roster;
import com.shiftplanner.shiftplanner.service.RosterService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/rosters")
public class RosterController {

    private final RosterService rosterService;

    public RosterController(RosterService rosterService) {
        this.rosterService = rosterService;
    }

    // CREATE ROSTER
    @PostMapping
    public Roster createRoster(@RequestBody RosterRequest request) {
        return rosterService.createRoster(
                request.getEmployeeId(),
                request.getShiftId()
        );
    }

    // GET ALL ROSTERS
    @GetMapping
    public List<Roster> getAllRosters() {
        return rosterService.getAllRosters();
    }

    // GET ROSTER BY ID
    @GetMapping("/{id}")
    public Roster getRosterById(@PathVariable Long id) {
        return rosterService.getRosterById(id);
    }

    // DELETE ROSTER
    @DeleteMapping("/{id}")
    public void deleteRoster(@PathVariable Long id) {
        rosterService.deleteRoster(id);
    }

    // REQUEST BODY CLASS
    public static class RosterRequest {

        private Long employeeId;
        private Long shiftId;

        public Long getEmployeeId() {
            return employeeId;
        }

        public void setEmployeeId(Long employeeId) {
            this.employeeId = employeeId;
        }

        public Long getShiftId() {
            return shiftId;
        }

        public void setShiftId(Long shiftId) {
            this.shiftId = shiftId;
        }
    }
}
