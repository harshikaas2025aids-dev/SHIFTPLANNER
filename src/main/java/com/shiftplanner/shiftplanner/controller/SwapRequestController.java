package com.shiftplanner.shiftplanner.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shiftplanner.shiftplanner.entity.SwapRequest;
import com.shiftplanner.shiftplanner.service.SwapRequestService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/swaps")
public class SwapRequestController {

    private final SwapRequestService swapRequestService;

    public SwapRequestController(SwapRequestService swapRequestService) {
        this.swapRequestService = swapRequestService;
    }

    // =========================================================
    // CREATE SWAP REQUEST
    // POST /api/swaps
    // =========================================================

    @PostMapping
    public SwapRequest createSwapRequest(
            @RequestBody SwapRequestRequest request) {

        return swapRequestService.createSwapRequest(
                request.getRosterId(),
                request.getRequesterId(),
                request.getColleagueId()
        );
    }

    // =========================================================
    // GET ALL SWAP REQUESTS
    // GET /api/swaps
    // =========================================================

    @GetMapping
    public List<SwapRequest> getAllSwapRequests() {

        return swapRequestService.getAllSwapRequests();
    }

    // =========================================================
    // GET ONE SWAP REQUEST
    // GET /api/swaps/{id}
    // =========================================================

    @GetMapping("/{id}")
    public SwapRequest getSwapRequestById(
            @PathVariable Long id) {

        return swapRequestService.getSwapRequestById(id);
    }

    // =========================================================
    // COLLEAGUE ACCEPTS
    // PUT /api/swaps/{id}/accept
    // =========================================================

    @PutMapping("/{id}/accept")
    public SwapRequest acceptSwapRequest(
            @PathVariable Long id) {

        return swapRequestService.acceptSwapRequest(id);
    }

    // =========================================================
    // COLLEAGUE DECLINES
    // PUT /api/swaps/{id}/decline
    // =========================================================

    @PutMapping("/{id}/decline")
    public SwapRequest declineSwapRequest(
            @PathVariable Long id) {

        return swapRequestService.declineSwapRequest(id);
    }

    // =========================================================
    // MANAGER APPROVES
    // PUT /api/swaps/{id}/approve
    // =========================================================

    @PutMapping("/{id}/approve")
    public SwapRequest approveSwapRequest(
            @PathVariable Long id) {

        return swapRequestService.approveSwapRequest(id);
    }

    // =========================================================
    // DELETE SWAP REQUEST
    // DELETE /api/swaps/{id}
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSwapRequest(
            @PathVariable Long id) {

        swapRequestService.deleteSwapRequest(id);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // REQUEST BODY CLASS
    // =========================================================

    public static class SwapRequestRequest {

        private Long rosterId;
        private Long requesterId;
        private Long colleagueId;

        public Long getRosterId() {
            return rosterId;
        }

        public void setRosterId(Long rosterId) {
            this.rosterId = rosterId;
        }

        public Long getRequesterId() {
            return requesterId;
        }

        public void setRequesterId(Long requesterId) {
            this.requesterId = requesterId;
        }

        public Long getColleagueId() {
            return colleagueId;
        }

        public void setColleagueId(Long colleagueId) {
            this.colleagueId = colleagueId;
        }
    }
}