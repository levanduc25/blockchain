const { body, validationResult } = require('express-validator');

exports.candidateValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('party').trim().notEmpty().withMessage('Party is required'),
  body('age').isInt({ min: 25 }).withMessage('Age must be at least 25'),
  body('photo').optional().isURL().withMessage('Invalid photo URL'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];