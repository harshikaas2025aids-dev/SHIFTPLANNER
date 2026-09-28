package com.shiftplanner.shiftplanner.repository;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shiftplanner.shiftplanner.entity.Employee;
import com.shiftplanner.shiftplanner.entity.Roster;
import com.shiftplanner.shiftplanner.entity.Shift;

public interface RosterRepository extends JpaRepository<Roster, Long> {

    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM Roster r
        WHERE r.employee = :employee
        AND r.shift.shiftDate = :shiftDate
        AND r.shift.startTime < :endTime
        AND r.shift.endTime > :startTime
    """)
    boolean existsOverlappingShift(
            @Param("employee") Employee employee,
            @Param("shiftDate") LocalDate shiftDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Find the roster belonging to an employee
    Roster findByEmployee(Employee employee);

    void deleteByEmployee(Employee employee);

    void deleteByShift(Shift shift);
}