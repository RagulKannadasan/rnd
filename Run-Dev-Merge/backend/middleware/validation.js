import Joi from 'joi';

export const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    planType: Joi.string().valid('basic', 'standard', 'premium').default('basic')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

export const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    serviceType: Joi.string().required().messages({
      'any.required': 'Service type is required'
    }),
    date: Joi.date().iso().min('now').required().messages({
      'date.min': 'Booking date cannot be in the past',
      'any.required': 'Booking date is required'
    }),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Please provide a valid time in HH:MM format',
      'any.required': 'Booking time is required'
    }),
    notes: Joi.string().max(500).messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
    contactInfo: Joi.object({
      phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).required().messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'any.required': 'Phone number is required'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
    }).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

export const validateSubscription = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    planType: Joi.string().valid('basic', 'standard', 'premium').required().messages({
      'any.only': 'Plan type must be basic, standard, or premium',
      'any.required': 'Plan type is required'
    }),
    preferences: Joi.object({
      newsletter: Joi.boolean().default(true),
      promotions: Joi.boolean().default(true),
      updates: Joi.boolean().default(true)
    }).default({})
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};