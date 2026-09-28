package com.shiftplanner.shiftplanner.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shiftplanner.shiftplanner.entity.Employee;
import com.shiftplanner.shiftplanner.entity.Roster;
import com.shiftplanner.shiftplanner.entity.SwapRequest;
import com.shiftplanner.shiftplanner.entity.SwapStatus;
import com.shiftplanner.shiftplanner.repository.EmployeeRepository;
import com.shiftplanner.shiftplanner.repository.RosterRepository;
import com.shiftplanner.shiftplanner.repository.SwapRequestRepository;

@Service
public class SwapRequestService {

    private final SwapRequestRepository swapRequestRepository;
    private final RosterRepository rosterRepository;
    private final EmployeeRepository employeeRepository;

    public SwapRequestService(
            SwapRequestRepository swapRequestRepository,
            RosterRepository rosterRepository,
            EmployeeRepository employeeRepository) {

        this.swapRequestRepository = swapRequestRepository;
        this.rosterRepository = rosterRepository;
        this.employeeRepository = employeeRepository;
    }

    // =========================================================
    // STEP 30 - CREATE SWAP REQUEST
    // =========================================================

    public SwapRequest createSwapRequest(
            Long rosterId,
            Long requesterId,
            Long colleagueId) {

        Roster roster = rosterRepository.findById(rosterId)
                .orElseThrow(() ->
                        new RuntimeException("Roster not found"));

        Employee requester = employeeRepository.findById(requesterId)
                .orElseThrow(() ->
                        new RuntimeException("Requester not found"));

        Employee colleague = employeeRepository.findById(colleagueId)
                .orElseThrow(() ->
                        new RuntimeException("Colleague not found"));

        SwapRequest swapRequest = new SwapRequest();

        swapRequest.setRoster(roster);
        swapRequest.setRequester(requester);
        swapRequest.setColleague(colleague);

        // Initial status
        swapRequest.setStatus(SwapStatus.PENDING);

        // Colleague has not accepted yet
        swapRequest.setColleagueAccepted(false);

        // Manager has not approved yet
        swapRequest.setManagerApproved(false);

        return swapRequestRepository.save(swapRequest);
    }

    // =========================================================
    // GET ALL SWAP REQUESTS
    // =========================================================

    public List<SwapRequest> getAllSwapRequests() {
        return swapRequestRepository.findAll();
    }

    // =========================================================
    // GET ONE SWAP REQUEST
    // =========================================================

    public SwapRequest getSwapRequestById(Long id) {

        return swapRequestRepository.findById(id)
                .orElse(null);
    }

    // =========================================================
    // STEP 31 - COLLEAGUE ACCEPTS
    // =========================================================

    public SwapRequest acceptSwapRequest(Long id) {

        SwapRequest swapRequest =
                swapRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Swap request not found"));

        // Colleague accepts
        swapRequest.setColleagueAccepted(true);

        // Change status
        swapRequest.setStatus(SwapStatus.ACCEPTED);

        // IMPORTANT:
        // Do NOT change the roster here.
        // Manager approval is still required.

        return swapRequestRepository.save(swapRequest);
    }

    // =========================================================
    // STEP 32 - COLLEAGUE DECLINES
    // =========================================================

    public SwapRequest declineSwapRequest(Long id) {

        SwapRequest swapRequest =
                swapRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Swap request not found"));

        // Colleague declines
        swapRequest.setColleagueAccepted(false);

        // Change status
        swapRequest.setStatus(SwapStatus.DECLINED);

        // IMPORTANT:
        // Do NOT change the roster.

        return swapRequestRepository.save(swapRequest);
    }

    // =========================================================
    // STEP 33 + STEP 34
    // MANAGER APPROVES AND APPLIES ACTUAL SWAP
    // =========================================================

    @Transactional
    public SwapRequest approveSwapRequest(Long id) {

        // -----------------------------------------------------
        // 1. Find swap request
        // -----------------------------------------------------

        SwapRequest swapRequest =
                swapRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Swap request not found"));

        // -----------------------------------------------------
        // 2. Colleague must accept first
        // -----------------------------------------------------

        if (!swapRequest.isColleagueAccepted()) {

            throw new RuntimeException(
                    "Swap cannot be approved before colleague acceptance.");
        }

        // -----------------------------------------------------
        // 3. Get Employee A's roster
        // -----------------------------------------------------

        Roster requesterRoster = swapRequest.getRoster();

        if (requesterRoster == null) {

            throw new RuntimeException(
                    "Requester roster not found.");
        }

        // -----------------------------------------------------
        // 4. Get Employee A
        // -----------------------------------------------------

        Employee requester = swapRequest.getRequester();

        if (requester == null) {

            throw new RuntimeException(
                    "Requester not found.");
        }

        // -----------------------------------------------------
        // 5. Get Employee B
        // -----------------------------------------------------

        Employee colleague = swapRequest.getColleague();

        if (colleague == null) {

            throw new RuntimeException(
                    "Colleague not found.");
        }

        // -----------------------------------------------------
        // 6. Find Employee B's roster
        // -----------------------------------------------------

        Roster colleagueRoster =
                rosterRepository.findByEmployee(colleague);

        if (colleagueRoster == null) {

            throw new RuntimeException(
                    "Colleague roster not found.");
        }

        // -----------------------------------------------------
        // 7. Check if Employee B can take Employee A's shift
        // -----------------------------------------------------

        boolean colleagueHasOverlap =
                rosterRepository.existsOverlappingShift(
                        colleague,
                        requesterRoster.getShift().getShiftDate(),
                        requesterRoster.getShift().getStartTime(),
                        requesterRoster.getShift().getEndTime()
                );

        if (colleagueHasOverlap) {

            throw new RuntimeException(
                    "Colleague already has an overlapping shift.");
        }

        // -----------------------------------------------------
        // 8. Check if Employee A can take Employee B's shift
        // -----------------------------------------------------

        boolean requesterHasOverlap =
                rosterRepository.existsOverlappingShift(
                        requester,
                        colleagueRoster.getShift().getShiftDate(),
                        colleagueRoster.getShift().getStartTime(),
                        colleagueRoster.getShift().getEndTime()
                );

        if (requesterHasOverlap) {

            throw new RuntimeException(
                    "Requester already has an overlapping shift.");
        }

        // -----------------------------------------------------
        // 9. Manager approves
        // -----------------------------------------------------

        swapRequest.setManagerApproved(true);

        swapRequest.setStatus(SwapStatus.APPROVED);

        // -----------------------------------------------------
        // 10. ACTUAL SWAP
        // -----------------------------------------------------

        // Employee A's shift goes to Employee B
        requesterRoster.setEmployee(colleague);

        // Employee B's shift goes to Employee A
        colleagueRoster.setEmployee(requester);

        // -----------------------------------------------------
        // 11. Save BOTH roster changes
        // -----------------------------------------------------

        rosterRepository.save(requesterRoster);

        rosterRepository.save(colleagueRoster);

        // -----------------------------------------------------
        // 12. Save swap request
        // -----------------------------------------------------

        return swapRequestRepository.save(swapRequest);
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    public SwapRequest updateStatus(
            Long id,
            SwapStatus status) {

        SwapRequest swapRequest =
                swapRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Swap request not found"));

        swapRequest.setStatus(status);

        return swapRequestRepository.save(swapRequest);
    }

    // =========================================================
    // DELETE SWAP REQUEST
    // =========================================================

    @Transactional
    public void deleteSwapRequest(Long id) {

        swapRequestRepository.deleteById(id);
    }
}