package com.shiftplanner.shiftplanner.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.shiftplanner.shiftplanner.entity.Shift;
import com.shiftplanner.shiftplanner.repository.RosterRepository;
import com.shiftplanner.shiftplanner.repository.ShiftRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final RosterRepository rosterRepository;

    public ShiftService(ShiftRepository shiftRepository, RosterRepository rosterRepository) {
        this.shiftRepository = shiftRepository;
        this.rosterRepository = rosterRepository;
    }

    // CREATE
    public Shift createShift(Shift shift) {
        return shiftRepository.save(shift);
    }

    // GET ALL
    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    // GET BY ID
    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id).orElse(null);
    }

    // UPDATE
    public Shift updateShift(Long id, Shift shift) {

        Shift existingShift = shiftRepository.findById(id).orElse(null);

        if (existingShift == null) {
            return null;
        }

        existingShift.setShiftDate(shift.getShiftDate());
        existingShift.setStartTime(shift.getStartTime());
        existingShift.setEndTime(shift.getEndTime());

        return shiftRepository.save(existingShift);
    }

    // DELETE
    @Transactional
    public void deleteShift(Long id) {
        Shift s = shiftRepository.findById(id).orElse(null);
        if (s != null) {
            rosterRepository.deleteByShift(s);
            shiftRepository.delete(s);
        }
    }
}
