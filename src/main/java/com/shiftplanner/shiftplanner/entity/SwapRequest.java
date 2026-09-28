package com.shiftplanner.shiftplanner.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "swap_requests")
public class SwapRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "roster_id")
    private Roster roster;

    @ManyToOne
    @JoinColumn(name = "requester_id")
    private Employee requester;

    @ManyToOne
    @JoinColumn(name = "colleague_id")
    private Employee colleague;

    @Enumerated(EnumType.STRING)
    private SwapStatus status = SwapStatus.PENDING;

    private boolean colleagueAccepted;

    private boolean managerApproved;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Roster getRoster() {
        return roster;
    }

    public void setRoster(Roster roster) {
        this.roster = roster;
    }

    public Employee getRequester() {
        return requester;
    }

    public void setRequester(Employee requester) {
        this.requester = requester;
    }

    public Employee getColleague() {
        return colleague;
    }

    public void setColleague(Employee colleague) {
        this.colleague = colleague;
    }

    public SwapStatus getStatus() {
        return status;
    }

    public void setStatus(SwapStatus status) {
        this.status = status;
    }

    public boolean isColleagueAccepted() {
        return colleagueAccepted;
    }

    public void setColleagueAccepted(boolean colleagueAccepted) {
        this.colleagueAccepted = colleagueAccepted;
    }

    public boolean isManagerApproved() {
        return managerApproved;
    }

    public void setManagerApproved(boolean managerApproved) {
        this.managerApproved = managerApproved;
    }
}