package com.shiftplanner.shiftplanner.service;

import com.shiftplanner.shiftplanner.entity.Employee;
import com.shiftplanner.shiftplanner.repository.EmployeeRepository;
import com.shiftplanner.shiftplanner.repository.RosterRepository;
import com.shiftplanner.shiftplanner.repository.SwapRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RosterRepository rosterRepository;
    private final SwapRequestRepository swapRequestRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            RosterRepository rosterRepository,
            SwapRequestRepository swapRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.rosterRepository = rosterRepository;
        this.swapRequestRepository = swapRequestRepository;
    }

    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    public Employee updateEmployee(Long id, Employee employee) {

        Employee existingEmployee = employeeRepository.findById(id).orElse(null);

        if (existingEmployee == null) {
            return null;
        }

        existingEmployee.setName(employee.getName());
        existingEmployee.setEmail(employee.getEmail());
        existingEmployee.setRole(employee.getRole());

        return employeeRepository.save(existingEmployee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee emp = employeeRepository.findById(id).orElse(null);
        if (emp != null) {
            swapRequestRepository.deleteByRequesterOrColleague(emp, emp);
            rosterRepository.deleteByEmployee(emp);
            employeeRepository.delete(emp);
        }
    }
}