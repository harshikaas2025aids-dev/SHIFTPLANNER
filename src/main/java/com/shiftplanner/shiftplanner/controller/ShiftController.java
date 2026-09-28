package com.shiftplanner.shiftplanner.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shiftplanner.shiftplanner.entity.Shift;
import com.shiftplanner.shiftplanner.service.ShiftService;

import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/shifts")
public class ShiftController {

    private final ShiftService shiftService;

    public ShiftController(ShiftService shiftService) {
        this.shiftService = shiftService;
    }

    // CREATE SHIFT
    @PostMapping
    public Shift createShift(@RequestBody Shift shift) {
        return shiftService.createShift(shift);
    }

    // GET ALL SHIFTS
    @GetMapping
    public List<Shift> getAllShifts() {
        return shiftService.getAllShifts();
    }

    // GET SHIFT BY ID
    @GetMapping("/{id}")
    public Shift getShiftById(@PathVariable Long id) {
        return shiftService.getShiftById(id);
    }

    // UPDATE SHIFT
    @PutMapping("/{id}")
    public Shift updateShift(
            @PathVariable Long id,
            @RequestBody Shift shift) {

        return shiftService.updateShift(id, shift);
    }

    // DELETE SHIFT
    @DeleteMapping("/{id}")
    public void deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
    }
}