const Department = require('../models/Department');
const User = require('../models/User');

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, departmentHead, parentDepartment, location } = req.body;
    
    const department = await Department.create({
      name, code, description, departmentHead, parentDepartment, location
    });
    
    await department.populate('departmentHead', 'firstName lastName email');
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('departmentHead', 'firstName lastName email')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 });
    
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('departmentHead', 'firstName lastName email')
      .populate('parentDepartment', 'name code');
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    const employees = await User.find({ department: req.params.id })
      .select('firstName lastName email designation');
    
    res.json({ success: true, data: { ...department.toObject(), employees } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('departmentHead', 'firstName lastName email');
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const employeeCount = await User.countDocuments({ department: req.params.id });
    
    if (employeeCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete department with ${employeeCount} employees. Please reassign them first.` 
      });
    }
    
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignEmployee = async (req, res) => {
  try {
    const { employeeId, departmentId } = req.body;
    
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    const user = await User.findByIdAndUpdate(
      employeeId,
      { department: departmentId },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    await updateEmployeeCount(departmentId);
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkAssignEmployees = async (req, res) => {
  try {
    const { employeeIds, departmentId } = req.body;
    
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    await User.updateMany(
      { _id: { $in: employeeIds } },
      { department: departmentId }
    );
    
    await updateEmployeeCount(departmentId);
    
    res.json({ success: true, message: `${employeeIds.length} employees assigned successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function updateEmployeeCount(departmentId) {
  const count = await User.countDocuments({ department: departmentId });
  await Department.findByIdAndUpdate(departmentId, { employeeCount: count });
}
