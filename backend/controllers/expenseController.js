const Expense = require('../models/Expense');

const getExpenses = async (req, res) => {
  try {
    const query = req.user.role === 'EMPLOYEE' ? { employeeId: req.user.id } : {};
    const expenses = await Expense.find(query)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      employeeId: req.user.id
    };

    // Handle receipt file upload
    if (req.file) {
      expenseData.receipt = {
        fileName: req.file.originalname,
        filePath: req.file.path
      };
    }

    const expense = new Expense(expenseData);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle receipt file upload
    if (req.file) {
      updateData.receipt = {
        fileName: req.file.originalname,
        filePath: req.file.path
      };
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, employeeId: req.user.id },
      updateData,
      { new: true }
    );
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const approveRejectExpense = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const updateData = {
      status,
      approvedBy: req.user.id,
      approvedDate: new Date()
    };
    
    if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason;
    }
    
    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  approveRejectExpense
};