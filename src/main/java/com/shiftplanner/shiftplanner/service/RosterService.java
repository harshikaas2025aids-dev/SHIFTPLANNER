package com.shiftplanner.shiftplanner.service;

import com.shiftplanner.shiftplanner.entity.Employee;
import com.shiftplanner.shiftplanner.entity.Roster;
import com.shiftplanner.shiftplanner.entity.Shift;
import com.shiftplanner.shiftplanner.repository.EmployeeRepository;
import com.shiftplanner.shiftplanner.repository.RosterRepository;
import com.shiftplanner.shiftplanner.repository.ShiftRepository;
import com.shiftplanner.shiftplanner.repository.SwapRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RosterService {

    private final EmployeeRepository employeeRepository;
    private final ShiftRepository shiftRepository;
    private final RosterRepository rosterRepository;
    private final SwapRequestRepository swapRequestRepository;

    public RosterService(
            EmployeeRepository employeeRepository,
            ShiftRepository shiftRepository,
            RosterRepository rosterRepository,
            SwapRequestRepository swapRequestRepository) {

        this.employeeRepository = employeeRepository;
        this.shiftRepository = shiftRepository;
        this.rosterRepository = rosterRepository;
        this.swapRequestRepository = swapRequestRepository;
    }

    // CREATE ROSTER
    public Roster createRoster(Long employeeId, Long shiftId) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        boolean overlapping = rosterRepository.existsOverlappingShift(
                employee,
                shift.getShiftDate(),
                shift.getStartTime(),
                shift.getEndTime()
        );

        if (overlapping) {
            throw new RuntimeException(
                    "Employee already has an overlapping shift."
            );
        }

        Roster roster = new Roster();

        roster.setEmployee(employee);
        roster.setShift(shift);

        return rosterRepository.save(roster);
    }

    // GET ALL
    public List<Roster> getAllRosters() {
        return rosterRepository.findAll();
    }

    // GET BY ID
    public Roster getRosterById(Long id) {
        return rosterRepository.findById(id).orElse(null);
    }

    // DELETE
    @Transactional
    public void deleteRoster(Long id) {
        Roster r = rosterRepository.findById(id).orElse(null);
        if (r != null) {
            swapRequestRepository.deleteByRoster(r);
            rosterRepository.delete(r);
        }
    }
}